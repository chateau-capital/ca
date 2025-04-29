# RWA4626 Quickstart Guide

This guide provides a quick overview of how to use the RWA4626 system for tokenized vaults.

## Prerequisites

- Node.js and npm installed
- Hardhat installed globally (`npm install -g hardhat`)
- A wallet with some ETH and USDC on the target network

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

## Deployment

1. Deploy the factory contract:
   ```bash
   npx hardhat run scripts/deploy_factory.js -- --network <network>
   ```
   Save the deployed factory address.

2. Create a new vault:
   ```bash
   npx hardhat run scripts/create_vault.js -- <factory_address> <usdc_address> 1000000
   ```
   Save the deployed vault address.

## Basic Operations

### Depositing USDC

```bash
npx hardhat run scripts/deposit.js -- <vault_address> <usdc_address> 1000000
```
This deposits 1 USDC into the vault and mints shares to your address.

### Withdrawing USDC

```bash
npx hardhat run scripts/withdraw.js -- <vault_address> 1000000
```
This withdraws 1 USDC worth of assets from the vault by burning shares.

### Minting Shares

```bash
npx hardhat run scripts/mint.js -- <vault_address> 1000000
```
This mints shares by depositing 1 USDC into the vault.

### Redeeming Shares

```bash
npx hardhat run scripts/redeem.js -- <vault_address> 1000000000000000000
```
This redeems 1 share for USDC.

## Admin Operations

### Updating Price

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
await vault.updatePrice(newPrice);
```

### Setting Fee

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
await vault.setFee(newFee);
```

### Withdrawing Fees

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
await vault.withdrawFees();
```

## Checking Vault Information

```javascript
const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);

// Get total assets
const totalAssets = await vault.totalAssets();
console.log("Total assets:", ethers.formatUnits(totalAssets, 6));

// Get total shares
const totalShares = await vault.totalSupply();
console.log("Total shares:", ethers.formatUnits(totalShares, 18));

// Get price per share
const price = await vault.price();
console.log("Price per share:", ethers.formatUnits(price, 6));

// Get user's shares
const userShares = await vault.balanceOf(userAddress);
console.log("User shares:", ethers.formatUnits(userShares, 18));

// Get user's assets
const userAssets = await vault.convertToAssets(userShares);
console.log("User assets:", ethers.formatUnits(userAssets, 6));
```

## Troubleshooting

### Common Issues

1. **Insufficient allowance**: Make sure you've approved the vault to spend your USDC.
   ```javascript
   const usdc = await ethers.getContractAt("IERC20", usdcAddress);
   await usdc.approve(vaultAddress, amount);
   ```

2. **Insufficient balance**: Make sure you have enough USDC or shares.
   ```javascript
   const usdcBalance = await usdc.balanceOf(userAddress);
   const shareBalance = await vault.balanceOf(userAddress);
   ```

3. **Vault paused**: The vault might be paused by the admin.
   ```javascript
   const isPaused = await vault.paused();
   ```

### Getting Help

If you encounter any issues not covered in this guide, please:

1. Check the full documentation in `README.md`
2. Open an issue on the GitHub repository
3. Contact the development team

## Next Steps

- Read the full documentation in `README.md`
- Explore the test suite in the `test` directory
- Check out the integration examples in the `examples` directory 