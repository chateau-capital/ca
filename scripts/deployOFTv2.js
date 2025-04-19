// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // Get the network to determine the LayerZero endpoint
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);
  
  // LayerZero endpoints for different networks
  const lzEndpoints = {
    arbitrumOne: "0x3c2269811836af69497E5F486A85D7316753cf62",
    arbitrumSepolia: "0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3",
    // Add more networks as needed
  };
  
  // Get the appropriate LayerZero endpoint for the current network
  const lzEndpoint = lzEndpoints[network];
  if (!lzEndpoint) {
    throw new Error(`No LayerZero endpoint configured for network: ${network}`);
  }
  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);
  
  // Deploy USDC OFTv2 token
  console.log("Deploying USDC OFTv2 token...");
  const USDCOFTv2 = await hre.ethers.deployContract("USDCOFTv2", [lzEndpoint]);
  const usdcOFTv2 = await USDCOFTv2.waitForDeployment();
  console.log(`USDC OFTv2 deployed to: ${usdcOFTv2.target}`);
  
  // Deploy Factory OFTv2
  console.log("Deploying Factory OFTv2...");
  const [deployer] = await hre.ethers.getSigners();
  const FactoryOFTv2 = await hre.ethers.deployContract("FactoryOFTv2", [deployer.address, lzEndpoint]);
  const factoryOFTv2 = await FactoryOFTv2.waitForDeployment();
  console.log(`Factory OFTv2 deployed to: ${factoryOFTv2.target}`);
  
  // Create a new fund using the Factory
  console.log("Creating a new fund...");
  const fundName = "Chateau Cross-Chain Fund";
  const fundTicker = "ch.CC";
  
  // First, do a static call to see what addresses will be created
  const expectedAddresses = await factoryOFTv2.newFund.staticCall(fundName, fundTicker, usdcOFTv2.target);
  console.log("Expected addresses:");
  console.log(`- Share Token: ${expectedAddresses[0]}`);
  console.log(`- Staking Pool: ${expectedAddresses[1]}`);
  console.log(`- Vault Pool: ${expectedAddresses[2]}`);
  
  // Now create the fund
  console.log("Creating fund...");
  const tx = await factoryOFTv2.newFund(fundName, fundTicker, usdcOFTv2.target);
  console.log(`Transaction hash: ${tx.hash}`);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log(`Fund created! Transaction confirmed in block ${receipt.blockNumber}`);
  
  // Log all deployed addresses
  console.table({
    usdcOFTv2: usdcOFTv2.target,
    factoryOFTv2: factoryOFTv2.target,
    shareToken: expectedAddresses[0],
    stakingPool: expectedAddresses[1],
    vaultPool: expectedAddresses[2],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 