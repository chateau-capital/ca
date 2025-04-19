// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // Replace with your deployed Factory contract address
  const FACTORY_ADDRESS = "0xc918c2F7dc13CB0b1bd06E8641ed68576Dc2367b";
  
  // USDC on Arbitrum Sepolia
  const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  
  // Get the Factory contract
  const factory = await hre.ethers.getContractAt("Factory", FACTORY_ADDRESS);
  
  // Fund details
  const fundName = "Chateau Anthropic";
  const fundTicker = "ch.Anthropic";
  
  console.log(`Creating new fund: ${fundName} (${fundTicker})`);
  
  // First, do a static call to see what addresses will be created
  const expectedAddresses = await factory.newFund.staticCall(fundName, fundTicker, USDC_ADDRESS);
  console.log("Expected addresses:");
  console.log(`- Share Token: ${expectedAddresses[0]}`);
  console.log(`- Staking Pool: ${expectedAddresses[1]}`);
  console.log(`- Vault Pool: ${expectedAddresses[2]}`);
  
  // Now create the fund
  console.log("Creating fund...");
  const tx = await factory.newFund(fundName, fundTicker, USDC_ADDRESS);
  console.log(`Transaction hash: ${tx.hash}`);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log(`Fund created! Transaction confirmed in block ${receipt.blockNumber}`);
  
  // Get the actual addresses from the event logs
  // This assumes your Factory contract emits an event with the addresses
  // You may need to adjust this based on your actual contract implementation
  console.log("Fund created successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 