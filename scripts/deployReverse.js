const hre = require("hardhat");

async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const Token = await hre.ethers.deployContract("USDC");
  const paymentToken = await Token.waitForDeployment();
  const Share = await ethers.getContractFactory("Share");
  const share = await Share.deploy("Share", "SHARE");
  const D7540 = await ethers.getContractFactory("TokenVault");
  const d7540 = await D7540.deploy(share.target, paymentToken.target, admin.address);
  await paymentToken.mint(admin.address, "100000000"); //100
  console.log(await Token.balanceOf(admin.address));
  console.log(admin.address);
  console.log("usdc", paymentToken.target);
  //   const USDT = await hre.ethers.getContractFactory("USDT");
  //   const usdtCoin = await USDT.deploy("1000000"); // Deploying USDT contract
  //   const QuadReaderUtils = await hre.ethers.getContractFactory("QuadReaderUtils");
  //   const quadReaderUtils = await QuadReaderUtils.deploy(); // Deploying USDT contract
  //   const Factory = await hre.ethers.deployContract("Factory", {
  //     libraries: {
  //       QuadReaderUtils: await quadReaderUtils.getAddress(),
  //     },
  //   });
  //   const factory = await Factory.waitForDeployment();
  //   const Fund = await factory.newFund.staticCall("RWA", "RWA", usdtCoin.target);
  //   await factory.newFund("CHAD.D", "Chateau Alternative Debt ", usdtCoin.target);

  console.table({
    shareCoin: share.target,
    usdtCoin: paymentToken.target,
    vault: d7540.target,
    owner: admin.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
