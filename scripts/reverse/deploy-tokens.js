const hre = require("hardhat");

async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const Token = await hre.ethers.deployContract("USDC");
  const paymentToken = await Token.waitForDeployment();
  const Share = await ethers.getContractFactory("Share");
  const share = await Share.deploy("Share", "SHARE");
  await paymentToken.mint(admin.address, "100000000"); //100

  console.table({
    shareCoin: share.target,
    usdtCoin: paymentToken.target,
    owner: admin.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
