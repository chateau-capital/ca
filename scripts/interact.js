const { ethers } = require("hardhat");

async function main() {
    // Get the signer (your wallet)
    const [signer] = await ethers.getSigners();
    console.log("Using address:", signer.address);

    // Contract addresses
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const SHARE_TOKEN_ADDRESS = "0x3691EF17df5b69aea8D89FC0b7958bC34dbFA878";
    const STAKING_POOL_ADDRESS = "0x704465F4a77AF3aDccd8Aa2Fcae55a625Dc3296c";
    const VAULT_POOL_ADDRESS = "0x12Cd1d188d525BB1F3D7ebB8f4F32629Ce4B6A2E";

    // Get contract instances
    const usdc = await ethers.getContractAt("USDC", USDC_ADDRESS);
    const shareToken = await ethers.getContractAt("Share", SHARE_TOKEN_ADDRESS);
    const stakingPool = await ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
    const vaultPool = await ethers.getContractAt("VaultPool", VAULT_POOL_ADDRESS);

    // Example: Check USDC balance
    const balance = await usdc.balanceOf(signer.address);
    console.log("USDC Balance:", ethers.utils.formatUnits(balance, 6));

    // Example: Check Share token balance
    const shareBalance = await shareToken.balanceOf(signer.address);
    console.log("Share Token Balance:", ethers.utils.formatEther(shareBalance));

    // Example: Get current price from VaultPool
    const price = await vaultPool.price();
    console.log("Current Price:", ethers.utils.formatUnits(price, 6));

    // Example: Get staking info
    const stakingInfo = await stakingPool.getStakingInfo(signer.address);
    console.log("Staking Info:", stakingInfo);

    // Example: Check if VaultPool is paused
    const isPaused = await vaultPool.paused();
    console.log("VaultPool Paused:", isPaused);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 