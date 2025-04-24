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

  // USDC ABI - minimal ABI with just the functions we need
  const usdcAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
  ];
  // USDC on ETH mainnet 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
  // USDC on Arbitrum 0xaf88d065e77c8cC2239327C5EDb3A432268e5831

  const usdcCoin = await hre.ethers.getContractAt(usdcAbi, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");//USDC on ETH mainnet
  // Get the USDC contract using the ABI directly


  const Factory = await hre.ethers.deployContract("Factory");
  const factory = await Factory.waitForDeployment();

  const Fund = await factory.newFund.staticCall("FundName","fTicker", usdcCoin.target);

  await factory.newFund("Chateau Alternative Debt","ch.AD", usdcCoin.target);

  console.table({
    shareCoin: Fund[0],
    usdcCoin: usdcCoin.target,
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
