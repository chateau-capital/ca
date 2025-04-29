// Script to deploy the RWA4626Factory contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying RWA4626Factory contract...");

  // Get the contract factory
  const RWA4626Factory = await ethers.getContractFactory("RWA4626Factory");

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy the contract with default minimum deposit of 1 USDC (6 decimals)
  const factory = await RWA4626Factory.deploy(1000000);

  // Wait for deployment to complete
  await factory.waitForDeployment();

  // Get the deployed contract address
  const factoryAddress = await factory.getAddress();
  console.log(`RWA4626Factory deployed to: ${factoryAddress}`);

  // Verify the contract on Etherscan (if on a public network)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for 6 block confirmations...");
    await factory.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [1000000],
    });
  }

  return factoryAddress;
}

// Execute the deployment
main()
  .then((address) => {
    console.log(`Deployment successful! Factory address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 