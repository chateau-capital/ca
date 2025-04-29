// Script to withdraw assets from an RWA4626Vault
const { ethers } = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx hardhat run scripts/withdraw.js -- <vault_address> <assets>");
    process.exit(1);
  }

  const vaultAddress = args[0];
  const assets = ethers.parseUnits(args[1], 6); // USDC has 6 decimals

  console.log("Withdrawing assets from RWA4626Vault...");
  console.log(`Vault address: ${vaultAddress}`);
  console.log(`Assets to withdraw: ${ethers.formatUnits(assets, 6)} USDC`);

  // Get the vault contract
  const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
  
  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Withdrawing with account: ${deployer.address}`);

  // Get the asset address
  const assetAddress = await vault.asset();
  console.log(`Asset address: ${assetAddress}`);

  // Get the current price
  const price = await vault.price();
  console.log(`Current price: ${ethers.formatUnits(price, 6)} USDC per share`);

  // Calculate expected shares
  const expectedShares = assets * ethers.parseUnits("1", 18) / price;
  console.log(`Expected shares to burn: ${ethers.formatUnits(expectedShares, 18)}`);

  // Withdraw assets
  console.log("Withdrawing assets...");
  const tx = await vault.withdraw(assets, deployer.address, deployer.address);
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

  const withdrawnAssets = event.args.assets;
  console.log(`Withdraw successful! Received ${ethers.formatUnits(withdrawnAssets, 6)} USDC`);

  return withdrawnAssets;
}

// Execute the script
main()
  .then((assets) => {
    console.log(`Withdraw complete! Total assets: ${ethers.formatUnits(assets, 6)} USDC`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Withdraw failed:", error);
    process.exit(1);
  }); 