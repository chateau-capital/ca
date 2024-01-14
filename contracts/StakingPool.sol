// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';

contract StakingPool is Ownable {
    IERC20 public issueToken;
    IERC20 public redeemToekn;

    struct UserIssue {
        address user;
        address issueAmount;
        address issueTime;
        bool isStaking;
    }

    mapping(uint => UserIssue) public userIssue;
    mapping(address => uint[]) public userIssueIndex;

    uint public currentIndexed;
    uint public validIndexed;

    constructor(IERC20 _issueToken, IERC20 _redeemToekn) {
        issueToken = _issueToken;
        redeemToekn = _redeemToekn;
        currentIndexed++;
    }

    function stake(uint256 amount) public {
        issueToken.transferFrom(msg.sender, address(this), amount);
        userIssue[currentIndexed] = UserIssue(
            msg.sender,
            amount,
            block.timestamp,
            true
        );
        userIssueIndex[msg.sender].push(currentIndexed);
        currentIndexed++;
    }

    function unstake(uint256 amount) public {
        uint[] memory userIssueIndexs = userIssueIndex[msg.sender];

        uint unstakeAmount;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            if (index > validIndexed) {
                UserIssue storage userIssue = userIssue[index];
                if (userIssue.isStaking) {
                    unstakeAmount += userIssue.issueAmount;
                    userIssue.isStaking = false;
                }
            }
        }

        if (unstakeAmount > 0) issueToken.transfer(msg.sender, unstakeAmount);
    }

    function withdraw(uint256 amount) public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.transfer(msg.sender, balance);
        validIndexed = currentIndexed;
    }
}
