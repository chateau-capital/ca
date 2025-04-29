# RWA4626 API Reference

This document provides a detailed reference for the RWA4626 contracts' functions and events.

## RWA4626Vault

### Functions

#### View Functions

| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| `name()` | Returns the name of the vault | None | `string` |
| `symbol()` | Returns the symbol of the vault | None | `string` |
| `decimals()` | Returns the decimals of the vault | None | `uint8` |
| `totalAssets()` | Returns the total amount of assets in the vault | None | `uint256` |
| `convertToShares(uint256 assets)` | Converts assets to shares | `assets`: Amount of assets | `uint256` |
| `convertToAssets(uint256 shares)` | Converts shares to assets | `shares`: Amount of shares | `uint256` |
| `maxDeposit(address receiver)` | Returns the maximum amount of assets that can be deposited | `receiver`: Address of the receiver | `uint256` |
| `previewDeposit(uint256 assets)` | Returns the amount of shares that would be minted for a deposit | `assets`: Amount of assets | `uint256` |
| `maxMint(address receiver)` | Returns the maximum amount of shares that can be minted | `receiver`: Address of the receiver | `uint256` |
| `previewMint(uint256 shares)` | Returns the amount of assets that would be deposited for minting | `shares`: Amount of shares | `uint256` |
| `maxWithdraw(address owner)` | Returns the maximum amount of assets that can be withdrawn | `owner`: Address of the owner | `uint256` |
| `previewWithdraw(uint256 assets)` | Returns the amount of shares that would be burned for a withdrawal | `assets`: Amount of assets | `uint256` |
| `maxRedeem(address owner)` | Returns the maximum amount of shares that can be redeemed | `owner`: Address of the owner | `uint256` |
| `previewRedeem(uint256 shares)` | Returns the amount of assets that would be withdrawn for redemption | `shares`: Amount of shares | `uint256` |
| `price()` | Returns the current price per share | None | `uint256` |
| `fee()` | Returns the current fee (in basis points) | None | `uint256` |
| `paused()` | Returns whether the vault is paused | None | `bool` |
| `owner()` | Returns the address of the owner | None | `address` |
| `asset()` | Returns the address of the asset token | None | `address` |
| `totalSupply()` | Returns the total supply of shares | None | `uint256` |
| `balanceOf(address account)` | Returns the balance of shares for an account | `account`: Address of the account | `uint256` |
| `allowance(address owner, address spender)` | Returns the allowance of shares for a spender | `owner`: Address of the owner, `spender`: Address of the spender | `uint256` |

#### State-Changing Functions

| Function | Description | Parameters | Events Emitted |
|----------|-------------|------------|----------------|
| `deposit(uint256 assets, address receiver)` | Deposits assets and mints shares | `assets`: Amount of assets, `receiver`: Address of the receiver | `Deposit` |
| `mint(uint256 shares, address receiver)` | Mints shares by depositing assets | `shares`: Amount of shares, `receiver`: Address of the receiver | `Deposit` |
| `withdraw(uint256 assets, address receiver, address owner)` | Withdraws assets by burning shares | `assets`: Amount of assets, `receiver`: Address of the receiver, `owner`: Address of the owner | `Withdraw` |
| `redeem(uint256 shares, address receiver, address owner)` | Redeems shares for assets | `shares`: Amount of shares, `receiver`: Address of the receiver, `owner`: Address of the owner | `Withdraw` |
| `approve(address spender, uint256 amount)` | Approves a spender to spend shares | `spender`: Address of the spender, `amount`: Amount of shares | `Approval` |
| `transfer(address to, uint256 amount)` | Transfers shares to an address | `to`: Address of the recipient, `amount`: Amount of shares | `Transfer` |
| `transferFrom(address from, address to, uint256 amount)` | Transfers shares from an address to another | `from`: Address of the sender, `to`: Address of the recipient, `amount`: Amount of shares | `Transfer` |
| `updatePrice(uint256 newPrice)` | Updates the price per share | `newPrice`: New price per share | `PriceUpdated` |
| `setFee(uint256 newFee)` | Sets the fee | `newFee`: New fee (in basis points) | `FeeUpdated` |
| `withdrawFees()` | Withdraws accumulated fees | None | `FeesWithdrawn` |
| `pause()` | Pauses the vault | None | `Paused` |
| `unpause()` | Unpauses the vault | None | `Unpaused` |

### Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `Deposit` | Emitted when assets are deposited | `caller`: Address of the caller, `receiver`: Address of the receiver, `assets`: Amount of assets, `shares`: Amount of shares |
| `Withdraw` | Emitted when assets are withdrawn | `caller`: Address of the caller, `receiver`: Address of the receiver, `owner`: Address of the owner, `assets`: Amount of assets, `shares`: Amount of shares |
| `Transfer` | Emitted when shares are transferred | `from`: Address of the sender, `to`: Address of the recipient, `amount`: Amount of shares |
| `Approval` | Emitted when shares are approved | `owner`: Address of the owner, `spender`: Address of the spender, `amount`: Amount of shares |
| `PriceUpdated` | Emitted when the price is updated | `oldPrice`: Old price, `newPrice`: New price |
| `FeeUpdated` | Emitted when the fee is updated | `oldFee`: Old fee, `newFee`: New fee |
| `FeesWithdrawn` | Emitted when fees are withdrawn | `amount`: Amount of fees withdrawn |
| `Paused` | Emitted when the vault is paused | `account`: Address of the account that paused the vault |
| `Unpaused` | Emitted when the vault is unpaused | `account`: Address of the account that unpaused the vault |

### Errors

| Error | Description | Parameters |
|-------|-------------|------------|
| `InsufficientBalance` | Thrown when there are insufficient shares | `requested`: Amount requested, `available`: Amount available |
| `InsufficientAllowance` | Thrown when there is insufficient allowance | `requested`: Amount requested, `available`: Amount available |
| `ZeroAmount` | Thrown when the amount is zero | None |
| `ZeroAddress` | Thrown when the address is zero | None |
| `InvalidPrice` | Thrown when the price is invalid | None |
| `InvalidFee` | Thrown when the fee is invalid | None |
| `Paused` | Thrown when the vault is paused | None |
| `NotPaused` | Thrown when the vault is not paused | None |
| `NotOwner` | Thrown when the caller is not the owner | None |

## RWA4626Factory

### Functions

#### View Functions

| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| `owner()` | Returns the address of the owner | None | `address` |
| `getVault(address asset)` | Returns the vault for an asset | `asset`: Address of the asset | `address` |

#### State-Changing Functions

| Function | Description | Parameters | Events Emitted |
|----------|-------------|------------|----------------|
| `createVault(address asset, uint256 initialPrice)` | Creates a new vault | `asset`: Address of the asset, `initialPrice`: Initial price per share | `VaultCreated` |

### Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `VaultCreated` | Emitted when a vault is created | `asset`: Address of the asset, `vault`: Address of the vault |

### Errors

| Error | Description | Parameters |
|-------|-------------|------------|
| `VaultAlreadyExists` | Thrown when a vault already exists for an asset | `asset`: Address of the asset |
| `ZeroAddress` | Thrown when the address is zero | None |
| `NotOwner` | Thrown when the caller is not the owner | None |

## Integration Examples

### Depositing Assets

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
const usdc = await ethers.getContractAt("IERC20", usdcAddress);

// Approve the vault to spend USDC
await usdc.approve(vaultAddress, amount);

// Deposit USDC and mint shares
await vault.deposit(amount, receiverAddress);
```

### Withdrawing Assets

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Withdraw USDC by burning shares
await vault.withdraw(amount, receiverAddress, ownerAddress);
```

### Minting Shares

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
const usdc = await ethers.getContractAt("IERC20", usdcAddress);

// Approve the vault to spend USDC
await usdc.approve(vaultAddress, amount);

// Mint shares by depositing USDC
await vault.mint(shares, receiverAddress);
```

### Redeeming Shares

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Redeem shares for USDC
await vault.redeem(shares, receiverAddress, ownerAddress);
```

### Creating a Vault

```javascript
const factory = await ethers.getContractAt("RWA4626Factory", factoryAddress);

// Create a new vault
await factory.createVault(usdcAddress, initialPrice);
```

### Updating Price

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Update the price per share
await vault.updatePrice(newPrice);
```

### Setting Fee

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Set the fee
await vault.setFee(newFee);
```

### Withdrawing Fees

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Withdraw accumulated fees
await vault.withdrawFees();
``` 