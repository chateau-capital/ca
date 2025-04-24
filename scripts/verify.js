const hre = require("hardhat");

async function main() {
  console.log("Starting contract verification...");

  // Get the network
  const network = hre.network.name;
  console.log(`Verifying contracts on ${network}...`);

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Verifying contracts deployed by:", deployer.address);

  // Contract addresses to verify
  const contracts = [
    {
      name: "Factory",
      address: "0x7eE5bfd433E3EAB7c0Ecc10fd22dceB8D40580a7",
      constructorArguments: []
    },
    {
      name: "StakingPool",
      address: "0x8D5C7b107d2ccd6ff9c003824BaA2b2253187B5f",
      constructorArguments: [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC address
        "0xb9d14B2a988A81F082a3ebbf8712a98e9Cc111aa", //share token address
        deployer.address
      ]
    },
    {
      name: "VaultPool",
      address: "0xc0d35A2e6D477962aD40584c43E2C442924201bc",
      constructorArguments: [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC address
        "0xb9d14B2a988A81F082a3ebbf8712a98e9Cc111aa", //share token address
        deployer.address
      ]
    }
  ];

  // Verify each contract separately
  for (const contract of contracts) {
    console.log(`\n=== Verifying ${contract.name} at ${contract.address} ===`);
    
    try {
      console.log(`Constructor arguments: ${JSON.stringify(contract.constructorArguments)}`);
      
      // Run verification with detailed output
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
        contract: `contracts/${contract.name}.sol:${contract.name}`,
      });
      
      console.log(`✅ ${contract.name} verified successfully!`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`ℹ️ ${contract.name} is already verified.`);
      } else {
        console.error(`❌ Error verifying ${contract.name}:`);
        console.error(`   ${error.message}`);
        
        // Try alternative verification method
        try {
          console.log(`Attempting alternative verification method for ${contract.name}...`);
          
          // Try with explicit contract path
          await hre.run("verify:verify", {
            address: contract.address,
            constructorArguments: contract.constructorArguments,
            contract: `contracts/${contract.name}.sol:${contract.name}`,
          });
          
          console.log(`✅ ${contract.name} verified successfully with alternative method!`);
        } catch (altError) {
          console.error(`❌ Alternative verification also failed:`);
          console.error(`   ${altError.message}`);
        }
      }
    }
  }

  console.log("\nVerification process completed!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
}); 