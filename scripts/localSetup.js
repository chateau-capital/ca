const hre = require("hardhat");

async function main() {
  const USDT = await hre.ethers.getContractFactory("USDT");
  const usdtCoin = await USDT.deploy("1000000"); // Deploying USDT contract
 
  const Factory = await hre.ethers.deployContract("Factory");
  const factory = await Factory.waitForDeployment();
  const Fund = await factory.newFund.staticCall("RWA", "RWA", usdtCoin.target);
  await factory.newFund("Chateau Alternative Debt","ch.AD", usdcCoin.target);

  console.table({
    shareCoin: Fund[0],
    usdtCoin: usdtCoin.target,
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
