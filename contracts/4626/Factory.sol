// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./4626.sol";

/**
 * @title RWA Vault Factory
 * @dev Factory contract for creating RWA4626Vault instances
 * 
 * This contract allows the creation of new RWA4626Vault instances, each representing
 * a separate RWA fund with its own underlying asset and share token.
 */
contract RWA4626Factory is Ownable {
    // ============ Events ============

    /**
     * @dev Emitted when a new RWA vault is created
     * @param vault The address of the created vault
     * @param asset The address of the underlying asset token
     * @param name The name of the vault
     * @param symbol The symbol of the vault
     * @param manager The address of the manager or owner of the new vault
     */
    event NewVaultCreated(
        address indexed vault,
        address indexed asset,
        string name,
        string symbol,
        address indexed manager
    );

    // ============ State Variables ============

    /// @dev Mapping from asset token address to its corresponding vault address
    mapping(address => address) public assetToVault;

    /// @dev Array of all created vaults
    address[] public allVaults;

    /// @dev Default minimum deposit amount for new vaults
    uint256 public defaultMinDeposit;

    // ============ Constructor ============

    /**
     * @dev Constructor that initializes the factory with the deployer as the owner
     * @param _defaultMinDeposit The default minimum deposit amount for new vaults
     */
    constructor(uint256 _defaultMinDeposit) Ownable(msg.sender) {
        defaultMinDeposit = _defaultMinDeposit;
    }

    // ============ External Functions ============

    /**
     * @dev Creates a new RWA4626Vault instance
     * @param name The name of the new vault
     * @param symbol The symbol of the new vault
     * @param asset The address of the underlying asset token
     * @param minDeposit The minimum deposit amount for the new vault
     * @return vault The address of the newly created vault
     */
    function createVault(
        string memory name,
        string memory symbol,
        address asset,
        uint256 minDeposit
    ) external onlyOwner returns (address vault) {
        require(asset != address(0), "Invalid asset address");
        require(assetToVault[asset] == address(0), "Vault already exists for this asset");

        // Create a new vault
        vault = address(new RWA4626Vault(
            asset,
            name,
            symbol,
            minDeposit
        ));

        // Transfer ownership to the caller
        RWA4626Vault(vault).transferOwnership(msg.sender);

        // Record the vault
        assetToVault[asset] = vault;
        allVaults.push(vault);

        emit NewVaultCreated(vault, asset, name, symbol, msg.sender);
    }

    /**
     * @dev Creates a new RWA4626Vault instance with the default minimum deposit
     * @param name The name of the new vault
     * @param symbol The symbol of the new vault
     * @param asset The address of the underlying asset token
     * @return vault The address of the newly created vault
     */
    function createVault(
        string memory name,
        string memory symbol,
        address asset
    ) external onlyOwner returns (address vault) {
        return createVault(name, symbol, asset, defaultMinDeposit);
    }

    /**
     * @dev Sets the default minimum deposit amount for new vaults
     * @param _defaultMinDeposit The new default minimum deposit amount
     */
    function setDefaultMinDeposit(uint256 _defaultMinDeposit) external onlyOwner {
        defaultMinDeposit = _defaultMinDeposit;
    }

    /**
     * @dev Returns the number of vaults created
     * @return The number of vaults
     */
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @dev Returns the address of a vault at a specific index
     * @param index The index of the vault
     * @return The address of the vault
     */
    function getVaultAtIndex(uint256 index) external view returns (address) {
        require(index < allVaults.length, "Index out of bounds");
        return allVaults[index];
    }
} 