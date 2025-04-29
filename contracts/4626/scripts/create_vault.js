// Script to create a new RWA4626Vault using the factory
const { ethers } = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx hardhat run scripts/create_vault.js -- <factory_address> <asset_address> [min_deposit]");
    process.exit(1);
  }

  const factoryAddress = args[0];
  const assetAddress = args[1];
  const minDeposit = args[2] ? ethers.parseUnits(args[2], 6) : ethers.parseUnits("1", 6); // Default 1 USDC

  console.log("Creating new RWA4626Vault...");
  console.log(`Factory address: ${factoryAddress}`);
  console.log(`Asset address: ${assetAddress}`);
  console.log(`Minimum deposit: ${ethers.formatUnits(minDeposit, 6)} USDC`);

  // Get the factory contract
  const factory = await ethers.getContractAt("RWA4626Factory", factoryAddress);

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Creating vault with account: ${deployer.address}`);

  // Create the vault
  const tx = await factory.createVault(
    assetAddress,
    "RWA Vault",
    "RWA-VAULT",
    minDeposit
  );

  // Wait for the transaction to be mined
  const receipt = await tx.wait();

  // Find the NewVaultCreated event
  const event = receipt.logs
    .map(log => {
      try {
        return factory.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(event => event && event.name === "NewVaultCreated");

  if (!event) {
    throw new Error("Failed to find NewVaultCreated event");
  }

  const vaultAddress = event.args.vault;
  console.log(`New RWA4626Vault created at: ${vaultAddress}`);

  return vaultAddress;
}

// Execute the script
main()
  .then((address) => {
    console.log(`Vault creation successful! Vault address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Vault creation failed:", error);
    process.exit(1);
  }); 