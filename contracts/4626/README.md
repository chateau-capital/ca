# RWA4626 System Documentation

## Overview

The RWA4626 system is a set of smart contracts that implement the ERC-4626 tokenized vault standard for Real World Assets (RWAs). This system allows users to deposit assets (like USDC) into vaults, receive shares representing their ownership, and withdraw their assets when needed.

The system consists of two main contracts:
1. `RWA4626Vault` - The core vault contract that implements the ERC-4626 standard
2. `RWA4626Factory` - A factory contract for deploying new vault instances

## Architecture

### RWA4626Vault

The `RWA4626Vault` contract is the core of the system, implementing the ERC-4626 standard for tokenized vaults. It allows users to:

- Deposit assets (USDC) and receive shares
- Withdraw assets by burning shares
- Mint shares directly by depositing assets
- Redeem shares for assets
- Query information about the vault, such as total assets, price per share, etc.

The vault also includes RWA-specific functionality:
- Price tracking for RWA assets
- Staking information tracking
- Fee mechanism for vault operations
- Admin controls for updating prices and withdrawing fees

### RWA4626Factory

The `RWA4626Factory` contract is responsible for creating new vault instances. It:

- Creates new vaults for specific asset tokens
- Tracks all created vaults
- Ensures only one vault exists per asset token
- Sets default minimum deposit amounts for new vaults

## Contract Details

### RWA4626Vault

#### State Variables

- `_asset`: The address of the underlying asset token (e.g., USDC)
- `_name`: The name of the vault
- `_symbol`: The symbol of the vault
- `_decimals`: The number of decimals for the vault shares (18)
- `_totalAssets`: The total amount of assets in the vault
- `_totalShares`: The total amount of shares issued
- `_price`: The current price of the RWA asset in USDC
- `_minDeposit`: The minimum amount of assets required for a deposit
- `_fee`: The fee charged for vault operations (in basis points, 1 = 0.01%)
- `_paused`: Whether the vault is paused
- `_userStakes`: Mapping from user address to their staking information
- `_pendingLiquidation`: The total amount of assets pending liquidation

#### Key Functions

##### ERC-4626 Standard Functions

- `deposit(uint256 assets, address receiver)`: Deposits assets and mints shares to the receiver
- `withdraw(uint256 assets, address receiver, address owner)`: Withdraws assets by burning shares from the owner
- `mint(uint256 shares, address receiver)`: Mints shares by depositing assets
- `redeem(uint256 shares, address receiver, address owner)`: Redeems shares for assets
- `totalAssets()`: Returns the total amount of assets in the vault
- `convertToShares(uint256 assets)`: Converts assets to shares
- `convertToAssets(uint256 shares)`: Converts shares to assets
- `maxDeposit(address)`: Returns the maximum amount of assets that can be deposited
- `maxMint(address)`: Returns the maximum amount of shares that can be minted
- `maxWithdraw(address owner)`: Returns the maximum amount of assets that can be withdrawn by the owner
- `maxRedeem(address owner)`: Returns the maximum amount of shares that can be redeemed by the owner
- `previewDeposit(uint256 assets)`: Returns the amount of shares that would be minted for a deposit
- `previewMint(uint256 shares)`: Returns the amount of assets that would be deposited for minting shares
- `previewWithdraw(uint256 assets)`: Returns the amount of shares that would be burned for a withdrawal
- `previewRedeem(uint256 shares)`: Returns the amount of assets that would be withdrawn for redeeming shares

##### RWA-Specific Functions

- `unstake(uint256 amount)`: Unstakes assets from the vault
- `getStakingInfo(address user)`: Returns the staking information for a user
- `setFee(uint256 newFee)`: Sets the fee for vault operations (admin only)
- `updatePrice(uint256 newPrice)`: Updates the price of the RWA asset (admin only)
- `pause()`: Pauses the vault (admin only)
- `unpause()`: Unpauses the vault (admin only)
- `withdrawFees()`: Withdraws accumulated fees (admin only)

#### Events

- `Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)`: Emitted when assets are deposited
- `Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)`: Emitted when assets are withdrawn
- `PriceUpdated(uint256 oldPrice, uint256 newPrice)`: Emitted when the price is updated
- `FeeUpdated(uint256 oldFee, uint256 newFee)`: Emitted when the fee is updated
- `AdminWithdrawn(address indexed admin, uint256 amount)`: Emitted when fees are withdrawn by the admin

### RWA4626Factory

#### State Variables

- `_vaultsByAsset`: Mapping from asset address to vault address
- `_allVaults`: Array of all created vault addresses
- `_defaultMinDeposit`: The default minimum deposit amount for new vaults

#### Key Functions

- `createVault(address asset, string memory name, string memory symbol, uint256 minDeposit)`: Creates a new vault for the specified asset
- `createVault(address asset)`: Creates a new vault with default parameters
- `setDefaultMinDeposit(uint256 newDefaultMinDeposit)`: Sets the default minimum deposit amount (admin only)
- `getVaultByAsset(address asset)`: Returns the vault address for the specified asset
- `getAllVaults()`: Returns an array of all created vault addresses

#### Events

- `NewVaultCreated(address indexed asset, address indexed vault)`: Emitted when a new vault is created

## Usage Guide

### Deployment

1. Deploy the factory contract:
   ```bash
   npx hardhat run scripts/deploy_factory.js -- --network <network>
   ```

2. Create a new vault using the factory:
   ```bash
   npx hardhat run scripts/create_vault.js -- <factory_address> <asset_address> [min_deposit]
   ```

### Depositing Assets

To deposit assets into a vault:

```bash
npx hardhat run scripts/deposit.js -- <vault_address> <asset_address> <amount>
```

This will:
1. Approve the vault to spend your assets if needed
2. Deposit the assets into the vault
3. Receive shares representing your ownership

### Withdrawing Assets

To withdraw assets from a vault:

```bash
npx hardhat run scripts/withdraw.js -- <vault_address> <assets>
```

This will:
1. Burn your shares
2. Receive the corresponding amount of assets

### Minting Shares

To mint shares directly:

```bash
npx hardhat run scripts/mint.js -- <vault_address> <assets>
```

This will:
1. Approve the vault to spend your assets if needed
2. Deposit the assets into the vault
3. Receive shares representing your ownership

### Redeeming Shares

To redeem shares for assets:

```bash
npx hardhat run scripts/redeem.js -- <vault_address> <shares>
```

This will:
1. Burn your shares
2. Receive the corresponding amount of assets

### Admin Functions

To update the price of the RWA asset:

```javascript
await vault.updatePrice(newPrice);
```

To set the fee for vault operations:

```javascript
await vault.setFee(newFee);
```

To withdraw accumulated fees:

```javascript
await vault.withdrawFees();
```

To pause or unpause the vault:

```javascript
await vault.pause();
await vault.unpause();
```

## Security Considerations

- The vault contract includes reentrancy protection to prevent attacks
- The vault can be paused in case of emergencies
- Admin functions are restricted to the owner of the contract
- The fee mechanism is transparent and can be audited
- The price of the RWA asset is tracked and can be updated by the admin

## Integration Guide

### Integrating with Other Contracts

To integrate the RWA4626Vault with other contracts, you can use the standard ERC-4626 interfaces:

```solidity
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract MyContract {
    IERC4626 public vault;
    
    constructor(address _vault) {
        vault = IERC4626(_vault);
    }
    
    function deposit(uint256 assets) external {
        // Approve the vault to spend your assets
        IERC20(vault.asset()).approve(address(vault), assets);
        
        // Deposit assets into the vault
        vault.deposit(assets, address(this));
    }
    
    function withdraw(uint256 assets) external {
        // Withdraw assets from the vault
        vault.withdraw(assets, address(this), address(this));
    }
}
```

### Querying Vault Information

To query information about a vault:

```javascript
// Get the total assets in the vault
const totalAssets = await vault.totalAssets();

// Get the total shares issued
const totalShares = await vault.totalSupply();

// Get the price per share
const price = await vault.price();

// Get the fee
const fee = await vault.fee();

// Get the minimum deposit
const minDeposit = await vault.minDeposit();

// Get the staking information for a user
const stakingInfo = await vault.getStakingInfo(userAddress);
```

## Testing

To test the contracts:

```bash
npx hardhat test
```

This will run the test suite for the contracts, including unit tests and integration tests.

## Deployment

To deploy the contracts to a network:

```bash
npx hardhat run scripts/deploy_factory.js -- --network <network>
```

Replace `<network>` with the name of the network you want to deploy to, as defined in your `hardhat.config.js` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 