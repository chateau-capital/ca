// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./utils/NotAmerica.sol";
import "./interface/IERC20Burnable.sol";

import "hardhat/console.sol";

/// @title Staking Pool for RWA Token Issuance
/// @author Kaso Qian
/// @dev This contract manages staking pools for RWA token issuance, incorporating a nationality check from the NotAmerica contract to exclude US persons.
/// @notice Allows for the staking of stablecoin to obtain RWA tokens and redeeming them under specified conditions, excluding US persons.

contract StakingPool is Ownable, NotAmerica {
    using SafeERC20 for IERC20Burnable;
    
    /// token to issue
    IERC20Burnable public issueToken;

    ///token to redeem
    IERC20Burnable public redeemToken;


     /// @dev Struct to track a user's staking details.
    struct Issue {
        /// The user's address
        address user;
        /// Amount staked
        uint issueAmount;
        /// Timestamp of when the stake was made
        uint issueTime;
        /// Whether the stake is currently active
        bool isStaking;
    }

    /// Mapping of issues by an index
    mapping(uint => Issue) public issues;

    /// Mapping of user addresses to their issue indexes
    mapping(address => uint[]) public userIssueIndex;

    /// End index for tracking issues
    uint public indexEnd;
    ///// Start index for managing unstaking
    uint public indexStart;

    /// Total amount pending for liquidation
    uint public pendingLiquidation;

    /// Rate for swapping shares to USDT (10000 = 100%). Also the NAV for the underlying asset / USD
    // uint public rate; // swap share to usdt - 10000 = 100%

    // Reentrancy state to prevent reentrancy attacks
    bool reentrancyState;


    /// @dev Sets the tokens to be issued and redeemed, and the owner of the contract
    /// @param _issueToken Token to be staked/issued
    /// @param _redeemToken Token to be redeemed
    /// @param _owner Owner of the contract
    constructor(
        address _issueToken,
        address _redeemToken,
        address _owner
    ) Ownable(_owner) {
        issueToken = IERC20Burnable(_issueToken);
        redeemToken = IERC20Burnable(_redeemToken);
        indexEnd++;
    }

    /// @notice Emitted when a user stakes tokens
    event UserStake(address indexed user, uint amount);

    /// @notice Emitted when a user unstakes tokens
    event UserUnstake(address indexed user, uint amount);

    /// @notice Emitted when admin withdraws tokens from the contract
    event AdminWithdraw(address indexed user, uint withdraw);

    /// @notice Stake tokens in the contract
    /// @dev Requires the caller to not be an American, as per the NotAmerica modifier
    /// @param amount The amount of tokens to stake
    function stake(uint256 amount) public NOT_AMERICAN reentrancy{
        require(amount >= 10 * 10 ** issueToken.decimals(), "Amount should be greater than 10");
        issueToken.safeTransferFrom(msg.sender, address(this), amount);
        issues[indexEnd] = Issue(msg.sender, amount, block.timestamp, true);
        userIssueIndex[msg.sender].push(indexEnd);
        indexEnd++;

        pendingLiquidation += amount;
        emit UserStake(msg.sender, amount);
    }


    /// @notice Allows users to unstake their tokens
    /// @dev Iterates over the user's issues to calculate total unstakable amount
    function unstake() public NOT_AMERICAN reentrancy{
        uint[] memory userIssueIndexs = userIssueIndex[msg.sender];

        uint unstakeAmount;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            if (index >= indexStart) {
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

    /// @notice Queries valid subscription information for the user's current turn
    /// @param user User address to query subscription info for
    /// @return Array of Issue structs representing the user's staking info

    function getStakingInfo(address user) public view returns (Issue[] memory) {
        require(user != address(0), "Invalid address");
        uint[] memory userIssueIndexs = userIssueIndex[user];

        uint key;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            Issue memory issueInfo = issues[index];

            if (index >= indexStart && issueInfo.isStaking) key++;
        }

        Issue[] memory userIssues = new Issue[](key);

        uint key2;
        for (uint i; i < userIssueIndexs.length; i++) {
            uint index = userIssueIndexs[i];
            Issue memory issueInfo = issues[index];

            if (index >= indexStart && issueInfo.isStaking) {
                userIssues[key2] = issueInfo;
                key2++;
            }
        }

        return userIssues;
    }

    /// @notice Admin function to withdraw issue tokens from the contract
    function withdraw() public onlyOwner {
        uint balance = issueToken.balanceOf(address(this));
        issueToken.safeTransfer(msg.sender, balance);
        indexStart = indexEnd;
        pendingLiquidation = 0;
        emit AdminWithdraw(msg.sender, balance);
    }

    modifier reentrancy() {
        require(!reentrancyState, "ReentrancyGuard: reentrant call");
        reentrancyState = true;
        _;
        reentrancyState = false;
    }
}
