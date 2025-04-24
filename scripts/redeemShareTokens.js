const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // Load contract ABIs
    const vaultPoolABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'VaultPool.json')));
    const shareABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'Share.json')));
    
    // Contract addresses
    const VAULT_POOL_ADDRESS = "0xc0d35A2e6D477962aD40584c43E2C442924201bc"; // Correct VaultPool address from verification scripts
    const SHARE_TOKEN_ADDRESS = "0xb9d14B2a988A81F082a3ebbf8712a98e9Cc111aa"; // Correct Share token address from verification scripts
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Using address:", signer.address);
    
    // Create contract instances
    const vaultPool = new ethers.Contract(VAULT_POOL_ADDRESS, vaultPoolABI, signer);
    const shareToken = new ethers.Contract(SHARE_TOKEN_ADDRESS, shareABI, signer);
    
    // Check if the contract is paused
    const isPaused = await vaultPool.paused();
    if (isPaused) {
        console.error("Error: The VaultPool contract is currently paused. Redemption is not available.");
        process.exit(1);
    }
    
    // Get current price
    const price = await vaultPool.price();
    console.log(`Current price: ${ethers.formatUnits(price, 6)} USDC per Share token`);
    
    // Get user's Share token balance
    const shareBalance = await shareToken.balanceOf(signer.address);
    console.log(`Your Share token balance: ${ethers.formatEther(shareBalance)} tokens`);
    
    if (shareBalance.eq(0)) {
        console.error("Error: You don't have any Share tokens to redeem");
        process.exit(1);
    }
    
    // Amount to redeem (using full balance as an example)
    const amountToRedeem = shareBalance;
    
    // Calculate expected USDC amount
    const expectedUsdcAmount = (price * amountToRedeem) / ethers.parseEther("1");
    console.log(`Expected USDC amount: ${ethers.formatUnits(expectedUsdcAmount, 6)} USDC`);
    
    // Check if there's enough liquidity in the VaultPool
    const issueTokenAddress = await vaultPool.issueToken();
    const issueToken = new ethers.Contract(issueTokenAddress, ["function balanceOf(address) view returns (uint256)"], signer);
    const vaultBalance = await issueToken.balanceOf(VAULT_POOL_ADDRESS);
    
    if (vaultBalance.lt(expectedUsdcAmount)) {
        console.error(`Error: Not enough liquidity in the VaultPool. Available: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
        process.exit(1);
    }
    
    // Approve Share tokens for redemption
    console.log("\nApproving Share tokens for redemption...");
    try {
        const approveTx = await shareToken.approve(VAULT_POOL_ADDRESS, amountToRedeem);
        console.log(`Approval transaction hash: ${approveTx.hash}`);
        await approveTx.wait();
        console.log("Approval confirmed!");
    } catch (error) {
        console.error("Error approving Share tokens:", error.message);
        process.exit(1);
    }
    
    // Redeem Share tokens
    console.log("\nRedeeming Share tokens...");
    try {
        const redeemTx = await vaultPool.redeem(amountToRedeem);
        console.log(`Redemption transaction hash: ${redeemTx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await redeemTx.wait();
        console.log(`Redemption successful! Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Verify new balances
        const newShareBalance = await shareToken.balanceOf(signer.address);
        const newUsdcBalance = await issueToken.balanceOf(signer.address);
        
        console.log("\n=== New Balances ===");
        console.log(`Share tokens: ${ethers.formatEther(newShareBalance)} tokens`);
        console.log(`USDC: ${ethers.formatUnits(newUsdcBalance, 6)} USDC`);
    } catch (error) {
        console.error("Error redeeming Share tokens:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 