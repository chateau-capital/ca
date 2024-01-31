// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interface/IERC20Burnable.sol";
import "./utils/NotAmerica.sol";

contract VaultPool is Ownable, NotAmerica,Pausable {
    using SafeERC20 for IERC20Burnable;

    IERC20Burnable public issueToken;
    IERC20Burnable public shareToekn;

    event UserRedeem(address indexed user, uint withdraw, uint burn);
    event AdminWithdraw(address indexed user, uint withdraw);

    constructor(
        address _issueToken,
        address _shareToekn,
        address _owner
    ) Ownable(_owner) {
        issueToken = IERC20Burnable(_issueToken);
        shareToekn = IERC20Burnable(_shareToekn);
    }

    function reedem(uint256 amount) public whenNotPaused NOT_AMERICAN{
        require(amount > 0, "Amount should be greater than 0");
        uint shareTotal = shareToekn.totalSupply();
        uint issueTotal = issueToken.balanceOf(address(this));
        uint withdrawAmount = (amount * issueTotal - 1) / (shareTotal + 1);

        require(withdrawAmount > 0 && issueTotal > 0, "withdrawAmount is zero");
        shareToekn.safeTransferFrom(msg.sender, address(this), amount);
        shareToekn.burn(amount);
        shareToekn.safeTransfer(msg.sender, withdrawAmount);

        emit UserRedeem(msg.sender, withdrawAmount, amount);
    }

    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.safeTransfer(msg.sender, balance);
        
        emit AdminWithdraw(msg.sender, balance);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
