const hre = require("hardhat");

async function main() {
  console.log("Starting contract verification...");

  // Get the network
  const network = hre.network.name;
  console.log(`Verifying contracts on ${network}...`);

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Contract addresses from deployment
  const FACTORY_ADDRESS = "0x7eE5bfd433E3EAB7c0Ecc10fd22dceB8D40580a7";
  const SHARE_TOKEN_ADDRESS = "0xb9d14B2a988A81F082a3ebbf8712a98e9Cc111aa";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const STAKING_POOL_ADDRESS = "0x8D5C7b107d2ccd6ff9c003824BaA2b2253187B5f";
  const VAULT_POOL_ADDRESS = "0xc0d35A2e6D477962aD40584c43E2C442924201bc";

  // Verify Factory
  console.log("\n=== Verifying Factory ===");
  try {
    await hre.run("verify:verify", {
      address: FACTORY_ADDRESS,
      constructorArguments: []
    });
    console.log("✅ Factory verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️ Factory is already verified.");
    } else {
      console.error("❌ Error verifying Factory:", error.message);
    }
  }

  // Verify Share Token
  console.log("\n=== Verifying Share Token ===");
  try {
    await hre.run("verify:verify", {
      address: SHARE_TOKEN_ADDRESS,
      constructorArguments: [
        "Chateau Alternative Debt", // name
        "ch.AD"                    // symbol
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