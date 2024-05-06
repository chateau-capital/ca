const hre = require("hardhat");
async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const D7540 = await ethers.getContractFactory("TokenVault", {
    libraries: {
      // QuadReaderUtils: "0xfeb98861425c6d2819c0d0ee70e45abcf71b43da", // arb one
      QuadReaderUtils: "0x49CF5d391B223E9196A7f5927A44D57fec1244C8",
    },
  });
  const paymentToken = "0x24f63Cf7427Dc75cEdeb1e1e1A8C7EA6e0452F76";
  const owner = "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7";
  const depositAddress = "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7";
  const priceControllerAddress = "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7";
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
    "Reverse",
    "Chateau Reverse Repo"
  );

  console.table({
    vault: d7540.target,
    admin: admin.address,
    other: "0xCDA0004Fe3Ca4A375Cf4df3761df64f9406337f7",
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
