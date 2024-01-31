// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StakingPool.sol";
import "./VaultPool.sol";
import "./coin/Share.sol";

contract Factory is Ownable {
    constructor() Ownable(msg.sender) { }

    event NewFundCreated(address indexed vaultPool, address indexed stakingPool, address indexed share, address issueToken, address manamger);

    struct ShareInfo {
        address stakingPool;
        address vaultPool;
    }

    mapping (address=>ShareInfo) public shareStakingpoolVault;

    function newFund(
        string memory name,
        string memory symbol,
        address issueToken
    ) public onlyOwner returns (address share, address stakingPool,address vaultPool) {
        share = address(new Share(name, symbol));
        stakingPool = address(new StakingPool(issueToken, share, msg.sender));
        vaultPool = address(new VaultPool(issueToken, share, msg.sender));
        shareStakingpoolVault[share] = ShareInfo(stakingPool, vaultPool);

        Share(share).setVault(address(vaultPool));
        Share(share).transferOwnership(msg.sender);

        emit NewFundCreated(vaultPool, stakingPool, share, issueToken, msg.sender);
    }
}