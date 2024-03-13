// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenVault.sol";
import "../coin/Share.sol";

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Tyler Fischer
/// @title TODO

contract TokenVaultFactory is Ownable {
    /// @dev Initializes the contract setting the deployer as the initial owner.
    constructor() Ownable(msg.sender) {}

    /// @notice Event emitted when a new fund is created.
    /// @param vaultPool Address of the created VaultPool contract.
    /// @param stakingPool Address of the created StakingPool contract.
    /// @param share Address of the created Share token contract.
    /// @param manager Address of the manager or owner of the new fund.
    event NewFundCreated(address indexed tokenVault, address manager);

    /// @dev Struct to hold information about share distribution including StakingPool and VaultPool addresses.
    /// @custom stakingPool stakingPool contract address
    /// @custom vaultPool vaultPool contract address
    struct ShareInfo {
        address stakingPool;
        address vaultPool;
    }

    /// @notice Mapping from Share token address to its corresponding StakingPool and VaultPool addresses.
    mapping(address => ShareInfo) public shareStakingpoolVault;

    /// @notice This function creates a new fund that will be used to manage the RWA, and when executed successfully it will generate two smart contracts, stakingPool and vaultPool.
    /// @param name Name of the new Fund
    /// @param symbol Ticker of the new Fund
    /// @return when executed successfully it will generate an address of a new Share, and addresses to two smart contracts, stakingPool and vaultPool.

    /// @notice Creates a new RWA ETF fund with associated StakingPool and VaultPool contracts. When executed successfully it will generate two smart contracts, stakingPool and vaultPool.
    /// @dev This function deploys new Share, StakingPool, and VaultPool contracts, and sets up their initial configurations including ownership and associations.
    /// @param name The name of the new fund (and its Share token).
    /// @param symbol The ticker symbol of the new fund's Share token.
    /// @return share The address of the newly created Share token contract.
    /// @return stakingPool The address of the newly created StakingPool contract.
    /// @return vaultPool The address of the newly created VaultPool contract.

    function NewVault(
        string memory name,
        string memory symbol,
        address shareAddress
    ) public onlyOwner returns (address tokenVault) {
        // share = address(new Share(name, symbol));
        tokenVault = new TokenVault(IERC20(shareAddress));

        // Share(share).setVault(address(vaultPool));
        // Share(share).transferOwnership(msg.sender);

        emit NewFundCreated(tokenVault, msg.sender);
    }
}
