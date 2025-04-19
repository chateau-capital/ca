// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ShareOFTv2.sol";
import "../StakingPool.sol";
import "../VaultPool.sol";

/// @title Factory Contract for OFTv2 Tokens
/// @dev Creates and manages Share tokens, StakingPools, and VaultPools with OFTv2 functionality
/// @notice This contract allows for the creation of new funds with cross-chain token capabilities
contract FactoryOFTv2 is Ownable {
    /// @notice Struct to store information about a fund.
    struct ShareInfo {
        /// The address of the staking pool for this fund.
        address stakingPool;
        /// The address of the vault pool for this fund.
        address vaultPool;
    }

    /// @notice Mapping from Share token address to its associated staking and vault pools.
    mapping(address => ShareInfo) public shareStakingpoolVault;

    /// @notice The LayerZero endpoint address for cross-chain messaging.
    address public lzEndpoint;

    /// @notice Emitted when a new fund is created.
    event NewFundCreated(
        address indexed vaultPool,
        address indexed stakingPool,
        address indexed share,
        address issueToken,
        address owner
    );

    /// @notice Creates a new Factory contract.
    /// @dev Sets the owner and the LayerZero endpoint address.
    /// @param _owner The address of the contract owner.
    /// @param _lzEndpoint The LayerZero endpoint address for cross-chain messaging.
    constructor(
        address _owner,
        address _lzEndpoint
    ) Ownable(_owner) {
        lzEndpoint = _lzEndpoint;
    }

    /// @notice Creates a new fund with OFTv2 Share token.
    /// @dev Deploys a new ShareOFTv2 token, StakingPool, and VaultPool.
    /// @param name The name of the fund.
    /// @param symbol The symbol of the fund.
    /// @param issueToken The address of the token to be used for staking.
    /// @return share The address of the newly created Share token.
    /// @return stakingPool The address of the newly created StakingPool.
    /// @return vaultPool The address of the newly created VaultPool.
    function newFund(
        string memory name,
        string memory symbol,
        address issueToken
    ) public onlyOwner returns (address share, address stakingPool, address vaultPool) {
        share = address(new ShareOFTv2(name, symbol, lzEndpoint));
        stakingPool = address(new StakingPool(issueToken, share, msg.sender));
        vaultPool = address(new VaultPool(issueToken, share, msg.sender));
        shareStakingpoolVault[share] = ShareInfo(stakingPool, vaultPool);

        ShareOFTv2(share).setVault(vaultPool);
        ShareOFTv2(share).transferOwnership(msg.sender);

        emit NewFundCreated(vaultPool, stakingPool, share, issueToken, msg.sender);
    }
} 