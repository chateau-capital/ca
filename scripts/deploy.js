// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // const USDTCoin = await hre.ethers.deployContract("USDT");
  // const usdtCoin = await USDTCoin.waitForDeployment();
  // USDC on Arbitrum 0xaf88d065e77c8cC2239327C5EDb3A432268e5831

  // const usdtCoin = await hre.ethers.getContractAt("USDT","0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");


  const usdcCoin = await hre.ethers.getContractAt("USDC","0xaf88d065e77c8cC2239327C5EDb3A432268e5831");

  const Factory = await hre.ethers.deployContract("Factory");
  const factory = await Factory.waitForDeployment();

  const Fund = await factory.newFund.staticCall("FundName","fTicker",usdcCoin.target);

  await factory.newFund("Chateau Alternative Debt","ch.AD", usdcCoin.target);

  console.table({
    shareCoin: Fund[0],
    usdtCoin: usdcCoin.target,
    stakingPool: Fund[1],
    vaultPool: Fund[2],
    factory: factory.target,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
