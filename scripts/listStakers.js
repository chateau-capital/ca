const { ethers } = require("hardhat");

async function main() {
    // Contract address
    const STAKING_POOL_ADDRESS = "0xA9022e82BF58CBEF61024967CE54fD13CC013d45";
    
    // Get the contract
    const stakingPool = await ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
    
    // Get total number of records
    const indexEnd = await stakingPool.indexEnd();
    const indexStart = await stakingPool.indexStart();
    
    console.log("\n=== Staking Pool Analysis ===");
    console.log(`Total records: ${indexEnd}`);
    console.log(`Active from index: ${indexStart}`);
    
    // Map to store user totals
    const userTotals = new Map();
    
    // Query each issue record
    console.log("\n=== Active Stakers ===");
    console.log("Address\t\t\t\tAmount (USDC)");
    console.log("------------------------------------------------");
    
    for(let i = indexStart; i < indexEnd; i++) {
        const issue = await stakingPool.issues(i);
        if(issue.isStaking) {
            // Convert BigNumber to string and then to number with 6 decimals
            const amount = Number(ethers.formatUnits(issue.issueAmount, 6)); // USDC has 6 decimals
            const user = issue.user;
            
            // Add to user totals
            const currentTotal = userTotals.get(user) || 0;
            userTotals.set(user, currentTotal + amount);
            
            console.log(`${user}\t${amount}`);
        }
    }
    
    // Print summary
    console.log("\n=== Summary by User ===");
    console.log("Address\t\t\t\tTotal Staked (USDC)");
    console.log("------------------------------------------------");
    for(const [user, total] of userTotals) {
        console.log(`${user}\t${total.toFixed(6)}`);
    }
    
    // Get total pending liquidation
    const pendingLiquidation = await stakingPool.pendingLiquidation();
    console.log("\n=== Pool Statistics ===");
    console.log(`Total Pending Liquidation: ${ethers.formatUnits(pendingLiquidation, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 