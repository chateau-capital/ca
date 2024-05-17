const hre = require("hardhat");
async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const D7540 = await ethers.getContractFactory("TokenVault", {
    libraries: {
      QuadReaderUtils: "0x122E7d91d384619FF9698F14ebC418DF697a1678", // arb one
      // QuadReaderUtils: "0x49CF5d391B223E9196A7f5927A44D57fec1244C8", // sep (i think)
    },
  });
  const arb_usdc = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
  const paymentToken = arb_usdc;
  const owner = "0xf80BA83d2a76E0a30C35FaC345EA26b295a4f63F";
  const depositAddress = "0xf80BA83d2a76E0a30C35FaC345EA26b295a4f63F";
  const priceControllerAddress = "0xf80BA83d2a76E0a30C35FaC345EA26b295a4f63F";
  // IERC20 _paymentToken,
  // address _owner,
  // address _depositAddress,
  // address _priceControllerAddress,
  // string memory _name,
  // string memory _symbol
  const d7540 = await D7540.deploy(
    paymentToken, // usdc
    owner,
    depositAddress,
    priceControllerAddress,
    "Chateau Reverse Repo",
    "CRR.D"
  );

  console.table({
    vault: d7540.target,
    admin: admin.address,
    other: "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7",
  });
  try {
    await hre.run("verify:verify", {
      address: d7540.target,
      constructorArguments: [arb_usdc, owner, depositAddress, priceControllerAddress, "Chateau Reverse Repo", "CRR.D"],
      network: "arbitrum",
    });
  } catch (e) {
    console.error(e);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
