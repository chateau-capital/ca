
const hre = require("hardhat");

async function main() {
  const USDT = await hre.ethers.getContractFactory("StableInstance");
  const usdtCoin = await USDT.deploy("1000000"); // Deploying USDT contract
  // await usdtCoin.deployed();
  console.log("tether address", await usdtCoin.getAddress())
  const QuadReaderUtils = await hre.ethers.deployContract("QuadReaderUtils");
  const quadReaderUtils = await QuadReaderUtils.waitForDeployment();

  const Factory = await hre.ethers.deployContract("Factory", {
    libraries: {
      QuadReaderUtils: "0x122E7d91d384619FF9698F14ebC418DF697a1678",
    },
  });
  const factory = await Factory.waitForDeployment();
  console.log('factory', await factory.getAddress())
  //
  const Fund = await factory.newFund.staticCall("RWA", "RWA", usdtCoin.target);
  await factory.newFund("CHAD.D", "Chateau Alternative Debt ", usdtCoin.target);

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
