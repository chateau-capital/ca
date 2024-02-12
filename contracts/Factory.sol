// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian
/// @notice create a single RWA asset ETF, generate a separate set of vaultPool and stakingPool. 


import "@openzeppelin/contracts/access/Ownable.sol";
import "./StakingPool.sol";
import "./VaultPool.sol";
import "./coin/Share.sol";

contract Factory is Ownable {
    constructor() Ownable(msg.sender) { }

    event NewFundCreated(address indexed vaultPool, address indexed stakingPool, address indexed share, address issueToken, address manager);

    /// @notice Get stakingpool and vaultpool contract addresses via RWA Token Lookup.
    /// @custom stakingPool stakingPool contract address
    /// @custom vaultPool vaultPool contract address

    struct ShareInfo {
        address stakingPool;
        address vaultPool;
    }

    mapping (address=>ShareInfo) public shareStakingpoolVault;


    /// @notice This function creates a new fund that will be used to manage the RWA, and when executed successfully it will generate two smart contracts, stakingPool and vaultPool. 
    /// @param name Name of the new Fund
    /// @param symbol Ticker of the new Fund
    /// @param issueToken address to receive fundraising funds
    /// @return when executed successfully it will generate an address of a new Share, and addresses to two smart contracts, stakingPool and vaultPool.

    function newFund(
        string memory name,
        string memory symbol,
        address issueToken
    ) public onlyOwner returns (address share, address stakingPool, address vaultPool) {
        share = address(new Share(name, symbol));
        stakingPool = address(new StakingPool(issueToken, share, msg.sender));
        vaultPool = address(new VaultPool(issueToken, share, msg.sender));
        shareStakingpoolVault[share] = ShareInfo(stakingPool, vaultPool);

        Share(share).setVault(address(vaultPool));
        Share(share).transferOwnership(msg.sender);

        emit NewFundCreated(vaultPool, stakingPool, share, issueToken, msg.sender);
    }
}