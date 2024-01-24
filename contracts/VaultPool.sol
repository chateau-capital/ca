// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./utils/NotAmerica.sol";
import "./interface/IStakingPool.sol";

contract VaultPool is Ownable, NotAmerica {
    IERC20 public issueToken;
    IERC20 public redeemToekn;

    IStakingPool public stakingPool;

    constructor(
        IERC20 _issueToken,
        IERC20 _redeemToekn,
        IStakingPool _stakingPool,
        address _passPortReader
    ) Ownable(msg.sender) NotAmerica(_passPortReader) {
        issueToken = _issueToken;
        redeemToekn = _redeemToekn;
        stakingPool = _stakingPool;
    }

    function reedem(uint256 amount) public notSettling NOT_AMERICAN{
        uint redeemTotal = redeemToekn.totalSupply(); // share
        uint issueTotal = issueToken.balanceOf(address(this)); // usdt

        uint redeemAmount = (redeemTotal * amount - 1) / (issueTotal + 1);
        redeemToekn.transfer(msg.sender, redeemAmount);
    }

    modifier notSettling() {
        require(stakingPool.isSettled(), "StakingPool: is settling");
        _;
    }
}
