// Script to deposit assets into an RWA4626Vault
const { ethers } = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx hardhat run scripts/deposit.js -- <vault_address> <asset_address> <amount>");
    process.exit(1);
  }

  const vaultAddress = args[0];
  const assetAddress = args[1];
  const amount = ethers.parseUnits(args[2], 6); // Assuming 6 decimals for USDC

  console.log("Depositing into RWA4626Vault...");
  console.log(`Vault address: ${vaultAddress}`);
  console.log(`Asset address: ${assetAddress}`);
  console.log(`Amount: ${ethers.formatUnits(amount, 6)} USDC`);

  // Get the vault contract
  const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
  
  // Get the asset contract
  const asset = await ethers.getContractAt("IERC20", assetAddress);

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Depositing with account: ${deployer.address}`);

  // Check allowance
  const allowance = await asset.allowance(deployer.address, vaultAddress);
  if (allowance.lt(amount)) {
    console.log("Approving asset transfer...");
    const approveTx = await asset.approve(vaultAddress, amount);
    await approveTx.wait();
    console.log("Asset transfer approved");
  }

  // Deposit into the vault
  console.log("Depositing assets...");
  const tx = await vault.deposit(amount, deployer.address);
  const receipt = await tx.wait();

  // Find the Deposit event
  const event = receipt.logs
    .map(log => {
      try {
        return vault.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(event => event && event.name === "Deposit");

  if (!event) {
    throw new Error("Failed to find Deposit event");
  }

  const shares = event.args.shares;
  console.log(`Deposit successful! Received ${ethers.formatUnits(shares, 18)} shares`);

  return shares;
}

// Execute the script
main()
  .then((shares) => {
    console.log(`Deposit complete! Total shares: ${ethers.formatUnits(shares, 18)}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deposit failed:", error);
    process.exit(1);
  }); 