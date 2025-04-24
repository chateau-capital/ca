const hre = require("hardhat");

async function main() {
  console.log("Starting contract verification on Arbitrum...");

  // Get the network
  const network = hre.network.name;
  console.log(`Verifying contracts on ${network}...`);

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Contract addresses from Arbitrum deployment
  const FACTORY_ADDRESS = "0xc918c2F7dc13CB0b1bd06E8641ed68576Dc2367b";
  const SHARE_TOKEN_ADDRESS = "0x3691EF17df5b69aea8D89FC0b7958bC34dbFA878";
  const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  const STAKING_POOL_ADDRESS = "0x704465F4a77AF3aDccd8Aa2Fcae55a625Dc3296c";
  const VAULT_POOL_ADDRESS = "0x12Cd1d188d525BB1F3D7ebB8f4F32629Ce4B6A2E";

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