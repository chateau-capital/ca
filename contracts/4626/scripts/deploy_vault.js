// Script to deploy the RWA4626Vault contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying RWA4626Vault contract...");

  // Get the contract factory
  const RWA4626Vault = await ethers.getContractFactory("RWA4626Vault");

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Get the USDC address (replace with your actual USDC address)
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC
  // For testnet, you might use: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" // Arbitrum USDC

  // Deploy the contract
  const vault = await RWA4626Vault.deploy(
    USDC_ADDRESS,
    "RWA Vault",
    "RWA",
    1000000 // 1 USDC minimum deposit (6 decimals)
  );

  // Wait for deployment to complete
  await vault.waitForDeployment();

  // Get the deployed contract address
  const vaultAddress = await vault.getAddress();
  console.log(`RWA4626Vault deployed to: ${vaultAddress}`);

  // Verify the contract on Etherscan (if on a public network)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for 6 block confirmations...");
    await vault.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [
        USDC_ADDRESS,
        "RWA Vault",
        "RWA",
        1000000
      ],
    });
  }

  return vaultAddress;
}

// Execute the deployment
main()
  .then((address) => {
    console.log(`Deployment successful! Vault address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 