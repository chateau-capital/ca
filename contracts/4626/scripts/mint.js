// Script to mint shares in an RWA4626Vault
const { ethers } = require("hardhat");

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx hardhat run scripts/mint.js -- <vault_address> <assets>");
    process.exit(1);
  }

  const vaultAddress = args[0];
  const assets = ethers.parseUnits(args[1], 6); // USDC uses 6 decimals

  console.log("Minting shares in RWA4626Vault...");
  console.log(`Vault address: ${vaultAddress}`);
  console.log(`Assets to deposit: ${ethers.formatUnits(assets, 6)} USDC`);

  // Get the vault contract
  const vault = await ethers.getContractAt("RWA4626Vault", vaultAddress);
  
  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Minting with account: ${deployer.address}`);

  // Get the asset address
  const assetAddress = await vault.asset();
  console.log(`Asset address: ${assetAddress}`);

  // Get the asset contract
  const asset = await ethers.getContractAt("IERC20", assetAddress);

  // Check allowance
  const allowance = await asset.allowance(deployer.address, vaultAddress);
  if (allowance < assets) {
    console.log("Approving asset transfer...");
    const approveTx = await asset.approve(vaultAddress, ethers.MaxUint256);
    await approveTx.wait();
    console.log("Asset transfer approved");
  }

  // Get the current price
  const price = await vault.price();
  console.log(`Current price: ${ethers.formatUnits(price, 6)} USDC per share`);

  // Calculate expected shares
  const expectedShares = assets * ethers.parseUnits("1", 18) / price;
  console.log(`Expected shares to receive: ${ethers.formatUnits(expectedShares, 18)}`);

  // Mint shares
  console.log("Minting shares...");
  const tx = await vault.mint(assets, deployer.address);
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
  console.log(`Minting successful! Received ${ethers.formatUnits(shares, 18)} shares`);

  return shares;
}

// Execute the script
main()
  .then((shares) => {
    console.log(`Minting complete! Total shares: ${ethers.formatUnits(shares, 18)}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Minting failed:", error);
    process.exit(1);
  }); 