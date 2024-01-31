// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./interface/IERC20Burnable.sol";
import "./utils/NotAmerica.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract VaultPool is Ownable, NotAmerica,Pausable {
    IERC20 public issueToken;
    IERC20Burnable public shareToekn;
    address public stakingPool;

    constructor(
        address _issueToken,
        address _shareToekn,
        address _stakingPool
    ) Ownable(msg.sender) {
        issueToken = IERC20(_issueToken);
        shareToekn = IERC20Burnable(_shareToekn);
        stakingPool = _stakingPool;
    }

    function reedem(uint256 amount) public whenNotPaused{
        uint shareTotal = shareToekn.totalSupply();
        uint issueTotal = issueToken.balanceOf(address(this));
        uint withdrawAmount = (amount * issueTotal - 1) / (shareTotal + 1)  ;

        require(withdrawAmount > 0 && issueTotal > 0, "withdrawAmount is zero");
        shareToekn.transferFrom(msg.sender, address(this), amount);
        shareToekn.burn(amount);
        shareToekn.transfer(msg.sender, withdrawAmount);
    }

    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.transfer(msg.sender, balance);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
