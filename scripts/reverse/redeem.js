const hre = require("hardhat");
const abi = require("../../artifacts/contracts/7540/TokenVault.sol/TokenVault.json");

async function main() {
  const requestId = 1;
  const [admin] = await ethers.getSigners();
  // Create a contract instance
  const contract = new ethers.Contract("0x729e26Ecc6c35f88dEBaF677ff8385900Bae9b2D", abi.abi, admin);
  // // Call the deposit method
  const tx = await contract.redeem(requestId);
  // // Wait for the transaction to be mined
  await tx.wait();

  console.log(`Transaction successful with hash: ${tx.hash}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
