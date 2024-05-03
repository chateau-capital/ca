const hre = require("hardhat");
async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const D7540 = await ethers.getContractFactory("TokenVault");
  const paymentToken = "0xA42E5F841B12cB82c6C42AD4C017fc0925614E2A";
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
    priceControllerAddress
    "Reverse",
     "CRR.D"
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
