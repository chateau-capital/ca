const hre = require("hardhat");
const abi = require("../../artifacts/contracts/7540/TokenVault.sol/TokenVault.json");

// npx hardhat run scripts/reverse/redeem.js --network arbitrumOne
async function main() {
  const requestId = 1;
  const [admin] = await ethers.getSigners();
  // Create a contract instance
  const contract = new ethers.Contract("0x65dc74a79cb07717ebe2817e9262c9fcdc4f0919", abi.abi, admin);
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
