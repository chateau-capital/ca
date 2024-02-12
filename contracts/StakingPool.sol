// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian
/// @notice user subscription, short-term redemption, transaction and record function, administrator withdrawal function. 
/// @dev audit pending

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./utils/NotAmerica.sol";

import "hardhat/console.sol";

contract StakingPool is Ownable, NotAmerica {
    using SafeERC20 for IERC20;
    
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

    uint public indexEnd;
    uint public indexStar;

    uint public pendingLiquidation;

    uint public rate; // swap share to usdt - 10000 = 100%

    constructor(
        address _issueToken,
        address _redeemToekn,
        address _owner
    ) Ownable(_owner) {
        issueToken = IERC20(_issueToken);
        redeemToekn = IERC20(_redeemToekn);
        indexEnd++;
    }

    event UserStake(address indexed user, uint amount);
    event UserUnstake(address indexed user, uint amount);
    event AdminWithdraw(address indexed user, uint withdraw);
    event RateChange(uint rate);


    /// @notice Users can pledge funds in a contract to be used as proof of subscription.
    /// @param amount: uint256, Number of tokens applied for
    
    function stake(uint256 amount) public NOT_AMERICAN {
        require(amount > 0, "Amount should be greater than 0");
        issueToken.safeTransferFrom(msg.sender, address(this), amount);
        issues[indexEnd] = Issue(msg.sender, amount, block.timestamp, true);
        userIssueIndex[msg.sender].push(indexEnd);
        indexEnd++;

        pendingLiquidation += amount;
        emit UserStake(msg.sender, amount);
    }


    /// @notice Users can withdraw their funds in full at any time before the end of the collection cycle.

    function unstake() public NOT_AMERICAN {
        uint[] memory userIssueIndexs = userIssueIndex[msg.sender];

        uint unstakeAmount;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            if (index > indexStar) {
                Issue storage issueInfo = issues[index];
                if (issueInfo.isStaking) {
                    unstakeAmount += issueInfo.issueAmount;
                    issueInfo.isStaking = false;
                }
            }
        }

        if (unstakeAmount > 0) {
            issueToken.safeTransfer(msg.sender, unstakeAmount);
            pendingLiquidation -= unstakeAmount;
            emit UserUnstake(msg.sender, unstakeAmount);
        }
    }

    /// @notice Query the valid subscription information of the user's current turn
    /// @param user: address, User address for subscription
    /// @returns   struct Issue {
                ///    address user: User address for subscription
                ///    uint issueAmount: Number of tokens spent by the user to subscribe for tokens
                ///    uint issueTime: Time for users to subscribe
                ///    bool isStaking: Whether or not the funds were raised
                /// }

    function getStakingInfo(address user) public view returns (Issue[] memory) {
        require(user != address(0), "Invalid address");
        uint[] memory userIssueIndexs = userIssueIndex[user];

        uint key;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            Issue memory issueInfo = issues[index];

            if (index > indexStar && issueInfo.isStaking) key++;
        }

        Issue[] memory userIssues = new Issue[](key);

        uint key2;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            Issue memory issueInfo = issues[index];

            if (index > indexStar && issueInfo.isStaking) {
                userIssues[key2] = issueInfo;
                key2++;
            }
        }

        return userIssues;
    }

    /// @notice Users of historical batches can sell their RWA shares to those who want to buy them at the moment by using this function, which can be executed if there are enough funds for the current round of subscriptions and they have not been withdrawn.
    /// @param amount: uint256, Number of RWA assets to be converted
    

    function swap(uint256 amount) external {
        require(amount > 0, "Amount should be greater than 0");
        require(rate > 0, "Rate should be greater than 0");
        require(
            redeemToekn.balanceOf(msg.sender) >= amount,
            "Insufficient balance of share token"
        );

        uint256 amountB = (amount * rate) / 10000;
        uint256 amountBTotal = amountB;

        require(
            pendingLiquidation >= amountB,
            "Insufficient balance of issue token"
        );

        redeemToekn.safeTransferFrom(msg.sender, address(this), amount);

        for (uint i = indexEnd; i > indexStar; i--) {
            Issue storage issueInfo = issues[i];
            if (issueInfo.isStaking) {
                if (amountB > 0) {
                    if (amountB >= issueInfo.issueAmount) {
                        uint amountA = (issueInfo.issueAmount * 10000) / rate;
                        amountB -= issueInfo.issueAmount;
                        redeemToekn.safeTransfer(issueInfo.user, amountA);
                        issueInfo.isStaking = false;
                    } else {
                        uint amountA = (amountB * 10000) / rate;
                        redeemToekn.safeTransfer(issueInfo.user, amountA);
                        issueInfo.issueAmount -= amountB;
                        amountB = 0;
                    }
                }
            }
        }

        pendingLiquidation -= amountBTotal;
        issueToken.safeTransfer(msg.sender, amountBTotal);
    }

    /// @notice Calling this function extracts the issueToken from the contract and can only be called by administrators.


    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.safeTransfer(msg.sender, balance);
        indexStar = indexEnd;
        pendingLiquidation = 0;
        emit AdminWithdraw(msg.sender, balance);
    }


    /// @notice Set the exchange ratio of swap, 10000 is 100%, only administrator can set it. Tied to NAV of the underlying product
    /// @param _rate: uint, Trading rate，10000 = 100%


    function setRate(uint _rate) public onlyOwner {
        rate = _rate;
        emit RateChange(_rate);
    }
}
