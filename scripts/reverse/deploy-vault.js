const hre = require("hardhat");
async function main() {
  const [admin, user1, user2] = await ethers.getSigners();
  const D7540 = await ethers.getContractFactory("TokenVault");

  const d7540 = await D7540.deploy(
    "0xe8057f0Af2246238A4C39f6E3647bDb2574d022A", // share
    "0xd6ea138d76eB92B0ED67905c8f1B6933a898128B", // usdc
    admin.address
  );
  await paymentToken.mint("0xf80BA83d2a76E0a30C35FaC345EA26b295a4f63F", "100000000", { gasLimit: 9000000 }); // add funds to test wallet here
  console.table({
    vault: d7540.target,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
