const hre = require("hardhat");

async function main() {
  console.log("Starting contract verification for new fund...");

  // Get the network
  const network = hre.network.name;
  console.log(`Verifying contracts on ${network}...`);

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Contract addresses from the new fund creation
  const SHARE_TOKEN_ADDRESS = "0x29cc607C62764B0084B3f011A13837ecBDBF82cC";
  const STAKING_POOL_ADDRESS = "0xA9022e82BF58CBEF61024967CE54fD13CC013d45";
  const VAULT_POOL_ADDRESS = "0x758246303a76eEf6567b92420821bf938D43AA3d";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  // Verify Share Token
  console.log("\n=== Verifying Share Token ===");
  try {
    await hre.run("verify:verify", {
      address: SHARE_TOKEN_ADDRESS,
      constructorArguments: [
        "ch.Anduril",  // name
        "ch.ADRL"      // symbol
      ]
    });
    console.log("✅ Share Token verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️ Share Token is already verified.");
    } else {
      console.error("❌ Error verifying Share Token:", error.message);
    }
  }

  // Verify StakingPool
  console.log("\n=== Verifying StakingPool ===");
  try {
    await hre.run("verify:verify", {
      address: STAKING_POOL_ADDRESS,
      constructorArguments: [
        USDC_ADDRESS,
        SHARE_TOKEN_ADDRESS,
        deployer.address
      ]
    });
    console.log("✅ StakingPool verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️ StakingPool is already verified.");
    } else {
      console.error("❌ Error verifying StakingPool:", error.message);
    }
  }

  // Verify VaultPool
  console.log("\n=== Verifying VaultPool ===");
  try {
    await hre.run("verify:verify", {
      address: VAULT_POOL_ADDRESS,
      constructorArguments: [
        USDC_ADDRESS,
        SHARE_TOKEN_ADDRESS,
        deployer.address
      ]
    });
    console.log("✅ VaultPool verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️ VaultPool is already verified.");
    } else {
      console.error("❌ Error verifying VaultPool:", error.message);
    }
  }

  console.log("\nVerification process completed!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
}); 