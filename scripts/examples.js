const { ethers } = require("hardhat");

/**
 * Contract Interaction Examples
 * This file demonstrates how to interact with the Share Token, StakingPool, and VaultPool contracts
 */

async function main() {
    // Contract addresses (replace with actual addresses)
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const SHARE_TOKEN_ADDRESS = "0x3691EF17df5b69aea8D89FC0b7958bC34dbFA878";
    const STAKING_POOL_ADDRESS = "0x704465F4a77AF3aDccd8Aa2Fcae55a625Dc3296c";
    const VAULT_POOL_ADDRESS = "0x12Cd1d188d525BB1F3D7ebB8f4F32629Ce4B6A2E";
    const OWNER_ADDRESS = "0x..."; // Replace with actual owner address
    const USER_ADDRESS = "0x...";  // Replace with actual user address

    // Get contract instances
    const usdc = await ethers.getContractAt("USDC", USDC_ADDRESS);
    const shareToken = await ethers.getContractAt("Share", SHARE_TOKEN_ADDRESS);
    const stakingPool = await ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
    const vaultPool = await ethers.getContractAt("VaultPool", VAULT_POOL_ADDRESS);

    // ===== Share Token Examples =====
    console.log("\n=== Share Token Examples ===");

    // Mint tokens to multiple addresses
    async function mintShareTokens() {
        try {
            const recipients = [USER_ADDRESS, "0x456..."];
            const amounts = [
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("200")
            ];
            const tx = await shareToken.mint(recipients, amounts);
            await tx.wait();
            console.log("Successfully minted Share tokens");
        } catch (error) {
            console.error("Minting failed:", error.message);
        }
    }

    // Burn tokens
    async function burnShareTokens() {
        try {
            const amount = ethers.utils.parseEther("50");
            const tx = await shareToken.burn(USER_ADDRESS, amount);
            await tx.wait();
            console.log("Successfully burned Share tokens");
        } catch (error) {
            console.error("Burning failed:", error.message);
        }
    }

    // Set vault address
    async function setVaultAddress() {
        try {
            const tx = await shareToken.setVault(VAULT_POOL_ADDRESS);
            await tx.wait();
            console.log("Successfully set vault address");
        } catch (error) {
            console.error("Setting vault failed:", error.message);
        }
    }

    // ===== StakingPool Examples =====
    console.log("\n=== StakingPool Examples ===");

    // Stake USDC
    async function stakeUSDC(amount) {
        try {
            // Check minimum stake amount
            if (amount < ethers.utils.parseUnits("10", 6)) {
                throw new Error("Amount must be at least 10 USDC");
            }

            // Check USDC balance
            const balance = await usdc.balanceOf(USER_ADDRESS);
            if (balance.lt(amount)) {
                throw new Error("Insufficient USDC balance");
            }

            // Approve and stake
            const approveTx = await usdc.approve(STAKING_POOL_ADDRESS, amount);
            await approveTx.wait();
            
            const stakeTx = await stakingPool.stake(amount);
            await stakeTx.wait();
            
            console.log("Successfully staked", amount.toString(), "USDC");
        } catch (error) {
            console.error("Staking failed:", error.message);
        }
    }

    // Unstake
    async function unstake() {
        try {
            const tx = await stakingPool.unstake();
            await tx.wait();
            console.log("Successfully unstaked");
        } catch (error) {
            console.error("Unstaking failed:", error.message);
        }
    }

    // Get staking info
    async function getStakingInfo() {
        try {
            const stakingInfo = await stakingPool.getStakingInfo(USER_ADDRESS);
            console.log("Staking Info:", stakingInfo);
        } catch (error) {
            console.error("Getting staking info failed:", error.message);
        }
    }

    // Admin withdraw
    async function adminWithdraw() {
        try {
            const tx = await stakingPool.withdraw();
            await tx.wait();
            console.log("Successfully withdrew all tokens");
        } catch (error) {
            console.error("Withdrawal failed:", error.message);
        }
    }

    // ===== VaultPool Examples =====
    console.log("\n=== VaultPool Examples ===");

    // Update price
    async function updatePrice() {
        try {
            const newPrice = 1050000; // $1.05
            const tx = await vaultPool.updatePrice(newPrice);
            await tx.wait();
            console.log("Successfully updated price to", newPrice/1e6, "USDC");
        } catch (error) {
            console.error("Price update failed:", error.message);
        }
    }

    // Redeem Share tokens
    async function redeemShareTokens(amount) {
        try {
            // Approve Share tokens
            const approveTx = await shareToken.approve(VAULT_POOL_ADDRESS, amount);
            await approveTx.wait();

            // Redeem
            const redeemTx = await vaultPool.redeem(amount);
            await redeemTx.wait();
            
            console.log("Successfully redeemed", amount.toString(), "Share tokens");
        } catch (error) {
            console.error("Redemption failed:", error.message);
        }
    }

    // Admin functions
    async function adminFunctions() {
        try {
            // Pause
            await vaultPool.pause();
            console.log("Successfully paused vault");

            // Unpause
            await vaultPool.unpause();
            console.log("Successfully unpaused vault");

            // Withdraw
            await vaultPool.withdraw();
            console.log("Successfully withdrew all tokens");
        } catch (error) {
            console.error("Admin function failed:", error.message);
        }
    }

    // ===== Event Listening Examples =====
    console.log("\n=== Event Listening Examples ===");

    // Listen for staking events
    stakingPool.on("UserStake", (user, amount) => {
        console.log(`User ${user} staked ${amount} USDC`);
    });

    // Listen for redemption events
    vaultPool.on("UserRedeem", (user, withdraw, burn) => {
        console.log(`User ${user} redeemed ${withdraw} USDC by burning ${burn} Share tokens`);
    });

    // Listen for price updates
    vaultPool.on("UpdatePrice", (user, price) => {
        console.log(`Price updated to ${price/1e6} USDC by ${user}`);
    });

    // ===== Complete Flow Example =====
    console.log("\n=== Complete Flow Example ===");

    async function completeFlow() {
        try {
            // 1. User stakes USDC
            const stakeAmount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
            await stakeUSDC(stakeAmount);

            // 2. Admin mints Share tokens
            await mintShareTokens();

            // 3. Admin updates price
            await updatePrice();

            // 4. User redeems Share tokens
            const redeemAmount = ethers.utils.parseEther("500"); // 500 Share tokens
            await redeemShareTokens(redeemAmount);

            // 5. Admin withdraws remaining USDC
            await adminWithdraw();

            console.log("Complete flow executed successfully");
        } catch (error) {
            console.error("Complete flow failed:", error.message);
        }
    }

    // Execute examples
    await completeFlow();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 