// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian & Hao Jun Tan
/// @notice  Contract that handles centralized user redemption function for RWA tokens
/// @dev audit pending
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interface/IERC20Burnable.sol";
import "./utils/NotAmerica.sol";

/// @title Vault Pool for RWA Token Redemption
/// @author Kaso Qian & Hao Jun Tan
/// @notice Manages centralized user redemption function for RWA tokens.
/// @dev integrates with NotAmerica for nationality checks, uses Pausable for emergency stops.

contract VaultPool is Ownable, NotAmerica, Pausable {
    using SafeERC20 for IERC20Burnable;

    /// @notice The token to be redeemed (stablecoin).
    IERC20Burnable public issueToken;

    /// @notice The RWA token users will burn to redeem the stablecoin.
    IERC20Burnable public shareToken;

    /// Ammendment!
    /// @notice Tracks the price for $1 USDT in share invested since inception of the Fund for this contract.
    /// @notice Updated periodically according to fund administrator reports. Saved as Price * 10 ** 6 to match USDT
    /// @dev Calculate the current value of RWA Tokens where: Net Asset Value = Price / 1000000 * Total RWA Tokens
    uint256 public price = 1e6;

    /// @notice Emitted when the admin updates the price for the RWA Token
    event UpdatePrice(address indexed user, uint256 price);

    /// @notice Emitted when a user redeems RWA tokens for stablecoin.
    event UserRedeem(address indexed user, uint withdraw, uint burn);

    /// @notice Emitted when the admin withdraws stablecoin from the contract.
    event AdminWithdraw(address indexed user, uint withdraw);

    // Reentrancy state to prevent reentrancy attacks
    bool reentrancyState;

    /// @dev Initializes the contract with the issue token, share token, and owner.
    /// @param _issueToken The address of the stablecoin token contract.
    /// @param _shareToken The address of the RWA token contract.
    /// @param _owner The address of the contract owner.
    constructor(
        address _issueToken,
        address _shareToken,
        address _owner
    ) Ownable(_owner) {
        issueToken = IERC20Burnable(_issueToken);
        shareToken = IERC20Burnable(_shareToken);
    }

    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /// @notice Updates Price of the RWA Tokens according to fund or asset manager reports
    function updatePrice(uint256 _newPrice) public onlyOwner {
        price = _newPrice;
        emit UpdatePrice(msg.sender, price);
    }

    /// FIX For redeem
    /// @notice Redeems stablecoin with RWA assets. Users get stablecoin and burn RWA tokens.
    /// @param amount The amount of RWA tokens to redeem in 10**18
    function redeem(
        uint256 amount
    ) public whenNotPaused NOT_AMERICAN reentrancy {
        require(amount > 0, "Amount should be greater than 0");

        /// @notice determines the correct amount of USDT owed to the user based on amount of RWA tokens they have.
        /// @dev converts amount in 10**18 to redeemAmount in 10**6 for stablecoins
        uint redeemAmount = (price * amount) / 1e18;

        uint stablecoinAvailableTotal = issueToken.balanceOf(address(this));

        require(
            redeemAmount <= stablecoinAvailableTotal,
            string.concat(
                "withdraw Amount exceeds available liquidity. Please try less than ",
                uint256ToString(stablecoinAvailableTotal)
            )
        );

        shareToken.safeTransferFrom(msg.sender, address(this), amount);
        shareToken.burn(amount);
        issueToken.safeTransfer(msg.sender, redeemAmount);

        emit UserRedeem(msg.sender, redeemAmount, amount);
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

    // Reentrancy guard
    modifier reentrancy() {
        require(!reentrancyState, "ReentrancyGuard: reentrant call");
        reentrancyState = true;
        _;
        reentrancyState = false;
    }
}
