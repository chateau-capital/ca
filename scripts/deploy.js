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

  const usdtCoin = await hre.ethers.getContractAt("USDT","0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");

  // const QuadReaderUtils = await hre.ethers.deployContract("QuadReaderUtils");
  // const quadReaderUtils = await QuadReaderUtils.waitForDeployment();

  const Factory = await hre.ethers.deployContract("Factory", {
    libraries: {
      QuadReaderUtils: "0x122E7d91d384619FF9698F14ebC418DF697a1678",
    },
  });
  const factory = await Factory.waitForDeployment();

  const Fund = await factory.newFund.staticCall("RWA","RWA",usdtCoin.target);
  await factory.newFund("CHAD.D","Chateau Alternative Debt ",usdtCoin.target);

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
