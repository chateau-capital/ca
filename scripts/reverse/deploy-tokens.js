const hre = require("hardhat");

async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const Token = await hre.ethers.deployContract("USDC");
  const paymentToken = await Token.waitForDeployment();
  await paymentToken.mint(admin.address, "1000000000"); //1000
  await paymentToken.mint("0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7", "1000000000"); //1000
  await paymentToken.mint("0xB134237A5E40Bf81cba215f128b158608dD63f6a", "1000000000"); //1000

  console.table({
    usdtCoin: paymentToken.target,
    owner: admin.address,
    otherAccount: "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7",
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
