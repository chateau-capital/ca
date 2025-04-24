const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // Load ABIs
    const shareABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'Share.json')));
    const stakingPoolABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'StakingPool.json')));
    const vaultPoolABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'VaultPool.json')));
    const usdtABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'USDT.json')));

    // Contract addresses
    const USDT_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
    const SHARE_TOKEN_ADDRESS = "0x3691EF17df5b69aea8D89FC0b7958bC34dbFA878";
    const STAKING_POOL_ADDRESS = "0x704465F4a77AF3aDccd8Aa2Fcae55a625Dc3296c";
    const VAULT_POOL_ADDRESS = "0x12Cd1d188d525BB1F3D7ebB8f4F32629Ce4B6A2E";

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Using address:", signer.address);

    // Create contract instances using ABIs
    const usdt = new ethers.Contract(USDT_ADDRESS, usdtABI, signer);
    const shareToken = new ethers.Contract(SHARE_TOKEN_ADDRESS, shareABI, signer);
    const stakingPool = new ethers.Contract(STAKING_POOL_ADDRESS, stakingPoolABI, signer);
    const vaultPool = new ethers.Contract(VAULT_POOL_ADDRESS, vaultPoolABI, signer);

    // Example interactions using the ABIs

    // 1. Share Token functions
    console.log("\n=== Share Token Functions ===");
    const shareBalance = await shareToken.balanceOf(signer.address);
    console.log("Share Token Balance:", ethers.utils.formatEther(shareBalance));

    // 2. StakingPool functions
    console.log("\n=== StakingPool Functions ===");
    const stakingInfo = await stakingPool.getStakingInfo(signer.address);
    console.log("Staking Info:", stakingInfo);

    // 3. VaultPool functions
    console.log("\n=== VaultPool Functions ===");
    const price = await vaultPool.price();
    console.log("Current Price:", ethers.utils.formatUnits(price, 6));

    // 4. USDT functions
    console.log("\n=== USDT Functions ===");
    const usdtBalance = await usdt.balanceOf(signer.address);
    console.log("USDT Balance:", ethers.utils.formatUnits(usdtBalance, 6));

    // Example of a transaction (commented out for safety)
    /*
    // Stake USDT
    const stakeAmount = ethers.utils.parseUnits("100", 6); // 100 USDT
    const approveTx = await usdt.approve(STAKING_POOL_ADDRESS, stakeAmount);
    await approveTx.wait();
    console.log("USDT approved for staking");

    const stakeTx = await stakingPool.stake(stakeAmount);
    await stakeTx.wait();
    console.log("Successfully staked USDT");
    */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 