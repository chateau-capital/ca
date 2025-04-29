const hre = require("hardhat");

async function main() {
  // Get the network
  const network = hre.network.name;
  console.log(`Checking staked amount on ${network}...`);

  // Get the signer (your wallet)
  const [signer] = await hre.ethers.getSigners();
  console.log("Using address:", signer.address);

  // Contract addresses - replace with the actual addresses from your deployment
  const STAKING_POOL_ADDRESS = "0x483668adFe30f7d2EAa90d44c180A2A14b31E126"; // StakingPool address from the latest deployment
  const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // USDC on Arbitrum One

  // Get contract instances
  const stakingPool = await hre.ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
  const usdc = await hre.ethers.getContractAt("USDC", USDC_ADDRESS);

  // Get user's staked amount
  const stakedAmount = await stakingPool.getStakedAmount(signer.address);
  console.log(`Your staked USDC amount: ${hre.ethers.formatUnits(stakedAmount, 6)} USDC`);

  // Get total staked amount in the pool
  const totalStaked = await stakingPool.getTotalStaked();
  console.log(`Total staked USDC in pool: ${hre.ethers.formatUnits(totalStaked, 6)} USDC`);

  // Get user's share of the pool (as a percentage)
  if (totalStaked.gt(0)) {
    const userShare = (stakedAmount * 100n) / totalStaked;
    console.log(`Your share of the pool: ${userShare}%`);
  }

  // Get additional staking info if available
  try {
    const stakingInfo = await stakingPool.getStakingInfo(signer.address);
    console.log("\nAdditional staking information:");
    console.log(`- Last staking timestamp: ${new Date(Number(stakingInfo.lastStakeTimestamp) * 1000).toLocaleString()}`);
    console.log(`- Staking period: ${stakingInfo.stakingPeriod} seconds`);
    console.log(`- Rewards earned: ${hre.ethers.formatUnits(stakingInfo.rewardsEarned, 6)} USDC`);
  } catch (error) {
    console.log("Additional staking information not available");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
}); 