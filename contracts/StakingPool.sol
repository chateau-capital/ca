// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./utils/NotAmerica.sol";

contract StakingPool is Ownable, NotAmerica {
    IERC20 public issueToken;
    IERC20 public redeemToekn;

    struct Issue {
        address user;
        uint issueAmount;
        uint issueTime;
        bool isStaking;
    }

    mapping(uint => Issue) public issues;
    mapping(address => uint[]) public userIssueIndex;

    uint public currentIndexed;
    uint public validIndexed;

    bool public isSettled = true;

    constructor(
        IERC20 _issueToken,
        IERC20 _redeemToekn
    ) Ownable(msg.sender) {
        issueToken = _issueToken;
        redeemToekn = _redeemToekn;
        currentIndexed++;
    }

    function stake(uint256 amount) public {
        issueToken.transferFrom(msg.sender, address(this), amount);
        issues[currentIndexed] = Issue(
            msg.sender,
            amount,
            block.timestamp,
            true
        );
        userIssueIndex[msg.sender].push(currentIndexed);
        currentIndexed++;
    }

    function unstake() public {
        uint[] memory userIssueIndexs = userIssueIndex[msg.sender];

        uint unstakeAmount;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            if (index > validIndexed) {
                Issue storage issueInfo = issues[index];
                if (issueInfo.isStaking) {
                    unstakeAmount += issueInfo.issueAmount;
                    issueInfo.isStaking = false;
                }
            }
        }

        if (unstakeAmount > 0) issueToken.transfer(msg.sender, unstakeAmount);
    }

    function getStakingInfo(address user) public view returns (Issue[] memory) {
        uint[] memory userIssueIndexs = userIssueIndex[user];
        Issue[] memory userIssues;

        uint key;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            Issue memory issueInfo = issues[index];

            if (index > validIndexed && issueInfo.isStaking) {
                userIssues[key] = issueInfo;
                key++;
            }
        }

        return userIssues;
    }

    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.transfer(msg.sender, balance);
        validIndexed = currentIndexed;
        isSettled = false;
    }

    function updateSettleState(bool bools) public onlyOwner {
        isSettled = bools;
    }
}
