// Script to redeem shares for assets in an RWA4626Vault
const { ethers } = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx hardhat run scripts/redeem.js -- <vault_address> <shares>");
    process.exit(1);
  }

  const vaultAddress = args[0];
  const shares = ethers.parseUnits(args[1], 18); // Vault shares use 18 decimals

  console.log("Redeeming shares in RWA4626Vault...");
  console.log(`Vault address: ${vaultAddress}`);
  console.log(`Shares to redeem: ${ethers.formatUnits(shares, 18)}`);

  // Get the vault contract
  const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
  
  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Redeeming with account: ${deployer.address}`);

  // Get the asset address
  const assetAddress = await vault.asset();
  console.log(`Asset address: ${assetAddress}`);

  // Get the current price
  const price = await vault.price();
  console.log(`Current price: ${ethers.formatUnits(price, 6)} USDC per share`);

  // Calculate expected assets
  const expectedAssets = shares * price / ethers.parseUnits("1", 18);
  console.log(`Expected assets to receive: ${ethers.formatUnits(expectedAssets, 6)} USDC`);

  // Redeem shares
  console.log("Redeeming shares...");
  const tx = await vault.redeem(shares, deployer.address, deployer.address);
  const receipt = await tx.wait();

  // Find the Withdraw event
  const event = receipt.logs
    .map(log => {
      try {
        return vault.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(event => event && event.name === "Withdraw");

  if (!event) {
    throw new Error("Failed to find Withdraw event");
  }

  const assets = event.args.assets;
  console.log(`Redeem successful! Received ${ethers.formatUnits(assets, 6)} USDC`);

  return assets;
}

// Execute the script
main()
  .then((assets) => {
    console.log(`Redeem complete! Total assets: ${ethers.formatUnits(assets, 6)} USDC`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Redeem failed:", error);
    process.exit(1);
  }); 