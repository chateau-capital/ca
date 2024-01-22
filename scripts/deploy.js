// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const ShareCoin = await hre.ethers.deployContract("Share");
  const shareCoin = await ShareCoin.waitForDeployment();

  const USDTCoin = await hre.ethers.deployContract("USDT");
  const usdtCoin = await USDTCoin.waitForDeployment();

  const StakingPool = await hre.ethers.deployContract("StakingPool",[usdtCoin.target, shareCoin.target]);
  const stakingPool = await StakingPool.waitForDeployment();

  const VaultPool = await hre.ethers.deployContract("VaultPool",[usdtCoin.target, shareCoin.target, stakingPool.target]);
  const vaultPool = await VaultPool.waitForDeployment();

  console.table({
    shareCoin: shareCoin.target,
    usdtCoin: usdtCoin.target,
    stakingPool: stakingPool.target,
    vaultPool: vaultPool.target,
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
