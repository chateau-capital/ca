const hre = require("hardhat");

async function main() {
  const USDT = await hre.ethers.getContractFactory("USDT");
  const usdtCoin = await USDT.deploy("1000000"); // Deploying USDT contract
  const QuadReaderUtils = await hre.ethers.getContractFactory("QuadReaderUtils");
  const quadReaderUtils = await QuadReaderUtils.deploy(); // Deploying USDT contract
  const Factory = await hre.ethers.deployContract("Factory", {
    libraries: {
      QuadReaderUtils: await quadReaderUtils.getAddress(),
    },
  });
  const factory = await Factory.waitForDeployment();
  const Fund = await factory.newFund.staticCall("RWA", "RWA", usdtCoin.target);
  await factory.newFund("CHAD.D", "Chateau Alternative Debt ", usdtCoin.target);

  console.table({
    shareCoin: Fund[0],
    usdtCoin: usdtCoin.target,
    stakingPool: Fund[1],
    vaultPool: Fund[2],
    factory: factory.target,
    quadReaderUtils: await quadReaderUtils.getAddress(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
