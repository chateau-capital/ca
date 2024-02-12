// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian
/// @notice  Contract that handles centralized user redemption function for RWA tokens
/// @dev audit pending

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interface/IERC20Burnable.sol";
import "./utils/NotAmerica.sol";


/// @title Vault Pool for RWA Token Redemption
/// @author Kaso Qian
/// @notice Manages centralized user redemption function for RWA tokens.
/// @dev integrates with NotAmerica for nationality checks, uses Pausable for emergency stops.

contract VaultPool is Ownable, NotAmerica,Pausable {
    using SafeERC20 for IERC20Burnable;

    /// @notice The token to be redeemed (stablecoin).
    IERC20Burnable public issueToken;

    /// @notice The RWA token users will burn to redeem the stablecoin.
    IERC20Burnable public shareToekn;

    /// @notice Emitted when a user redeems RWA tokens for stablecoin.
    event UserRedeem(address indexed user, uint withdraw, uint burn);

    /// @notice Emitted when the admin withdraws stablecoin from the contract.
    event AdminWithdraw(address indexed user, uint withdraw);

    /// @dev Initializes the contract with the issue token, share token, and owner.
    /// @param _issueToken The address of the stablecoin token contract.
    /// @param _shareToken The address of the RWA token contract.
    /// @param _owner The address of the contract owner.
    constructor(
        address _issueToken,
        address _shareToekn,
        address _owner
    ) Ownable(_owner) {
        issueToken = IERC20Burnable(_issueToken);
        shareToekn = IERC20Burnable(_shareToekn);
    }

    /// @notice Redeems stablecoin with RWA assets. Users get stablecoin and burn RWA tokens.
    /// @param amount The amount of RWA tokens to redeem.
    function reedem(uint256 amount) public whenNotPaused NOT_AMERICAN{
        require(amount > 0, "Amount should be greater than 0");
        uint shareTotal = shareToekn.totalSupply();
        uint issueTotal = issueToken.balanceOf(address(this));
        uint withdrawAmount = (amount * issueTotal - 1) / (shareTotal + 1);

        require(withdrawAmount > 0 && issueTotal > 0, "withdrawAmount is zero");
        shareToekn.safeTransferFrom(msg.sender, address(this), amount);
        shareToekn.burn(amount);
        issueToken.safeTransfer(msg.sender, withdrawAmount);

        emit UserRedeem(msg.sender, withdrawAmount, amount);
    }

    /// @notice Withdraws stablecoins for the next round of RWA requisitions by the administrator.
    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.safeTransfer(msg.sender, balance);
        _pause();
        emit AdminWithdraw(msg.sender, balance);
    }

    /// @notice Suspends user redemptions, callable only by administrators.
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Resumes user redemptions, callable only by administrators.
    function unpause() public onlyOwner {
        _unpause();
    }
}
