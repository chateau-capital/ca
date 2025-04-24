const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // Load Share token ABI
    const shareABI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'abi', 'Share.json')));
    
    // Contract address - replace with your Share token address
    const SHARE_TOKEN_ADDRESS = "0x3691EF17df5b69aea8D89FC0b7958bC34dbFA878";
    
    // Get signer (must be the owner of the Share token)
    const [signer] = await ethers.getSigners();
    console.log("Using address:", signer.address);
    
    // Create Share token contract instance
    const shareToken = new ethers.Contract(SHARE_TOKEN_ADDRESS, shareABI, signer);
    
    // Check if the signer is the owner
    const owner = await shareToken.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("Error: You must be the owner of the Share token to mint tokens");
        process.exit(1);
    }
    
    // List of addresses to mint tokens to
    const recipients = [
        "0x1EA517f9404A9456f78EB5BE3C6Abd3630151588",
        "0x8CF87bE2A2BB9AD564fd16dEaeC97B0E99a335DA"
    ];
    
    // Amounts to mint to each address (in token units with 18 decimals)
    const amounts = [
        ethers.parseEther((10/1.55).toString()),  // 100 tokens
        ethers.parseEther((15/1.55).toString())   // 150 tokens
    ];
    
    // Verify arrays have the same length
    if (recipients.length !== amounts.length) {
        console.error("Error: recipients and amounts arrays must have the same length");
        process.exit(1);
    }
    
    console.log("\n=== Minting Share Tokens ===");
    console.log("Recipients:");
    for (let i = 0; i < recipients.length; i++) {
        console.log(`${recipients[i]}: ${ethers.formatEther(amounts[i])} tokens`);
    }
    
    // Mint tokens
    try {
        console.log("\nMinting tokens...");
        const tx = await shareToken.mint(recipients, amounts);
        console.log(`Transaction hash: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Tokens minted successfully! Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Verify balances
        console.log("\n=== Verifying Balances ===");
        for (let i = 0; i < recipients.length; i++) {
            const balance = await shareToken.balanceOf(recipients[i]);
            console.log(`${recipients[i]}: ${ethers.formatEther(balance)} tokens`);
        }
    } catch (error) {
        console.error("Error minting tokens:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 