// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StakingPool.sol";
import "./VaultPool.sol";
import "./coin/Share.sol";


/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian
/// @notice create a single RWA asset ETF, generate a separate set of vaultPool and stakingPool. 

/// @title a contract that creates a single RWA asset by, generating a separate set of vaultPool and stakingPool contracts

contract Factory is Ownable {

     /// @dev Initializes the contract setting the deployer as the initial owner.
    constructor() Ownable(msg.sender) { }


    /// @notice Event emitted when a new fund is created.
    /// @param vaultPool Address of the created VaultPool contract.
    /// @param stakingPool Address of the created StakingPool contract.
    /// @param share Address of the created Share token contract.
    /// @param issueToken Address of the token used for issuing shares.
    /// @param manager Address of the manager or owner of the new fund.
    event NewFundCreated(address indexed vaultPool, address indexed stakingPool, address indexed share, address issueToken, address manager);

    /// @dev Struct to hold information about share distribution including StakingPool and VaultPool addresses.
    /// @custom stakingPool stakingPool contract address
    /// @custom vaultPool vaultPool contract address
    struct ShareInfo {
        address stakingPool;
        address vaultPool;
    }


    /// @notice Mapping from Share token address to its corresponding StakingPool and VaultPool addresses.
    mapping (address=>ShareInfo) public shareStakingpoolVault;


    /// @notice This function creates a new fund that will be used to manage the RWA, and when executed successfully it will generate two smart contracts, stakingPool and vaultPool. 
    /// @param name Name of the new Fund
    /// @param symbol Ticker of the new Fund
    /// @param issueToken address to receive fundraising funds
    /// @return when executed successfully it will generate an address of a new Share, and addresses to two smart contracts, stakingPool and vaultPool.


    /// @notice Creates a new RWA ETF fund with associated StakingPool and VaultPool contracts. When executed successfully it will generate two smart contracts, stakingPool and vaultPool. 
    /// @dev This function deploys new Share, StakingPool, and VaultPool contracts, and sets up their initial configurations including ownership and associations.
    /// @param name The name of the new fund (and its Share token).
    /// @param symbol The ticker symbol of the new fund's Share token.
    /// @param issueToken The address of the token used to issue new shares.
    /// @return share The address of the newly created Share token contract.
    /// @return stakingPool The address of the newly created StakingPool contract.
    /// @return vaultPool The address of the newly created VaultPool contract.
 
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