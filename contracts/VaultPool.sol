// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./utils/NotAmerica.sol";

contract VaultPool is Ownable, NotAmerica {
    IERC20 public issueToken;
    IERC20 public redeemToekn;
    address public stakingPool;

    constructor(
        address _issueToken,
        address _redeemToekn,
        address _stakingPool
    ) Ownable(msg.sender) {
        issueToken = IERC20(_issueToken);
        redeemToekn = IERC20(_redeemToekn);
        stakingPool = _stakingPool;
    }

    function reedem(uint256 amount) public {
        uint redeemTotal = redeemToekn.totalSupply(); // share
        uint issueTotal = issueToken.balanceOf(address(this)); // usdt

        uint redeemAmount = (redeemTotal * amount - 1) / (issueTotal + 1);
        redeemToekn.transfer(msg.sender, redeemAmount);
    }
}
