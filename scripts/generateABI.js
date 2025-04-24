const fs = require('fs');
const path = require('path');

async function main() {
    // Get contract artifacts
    const Share = await hre.artifacts.readArtifact("Share");
    const StakingPool = await hre.artifacts.readArtifact("StakingPool");
    const VaultPool = await hre.artifacts.readArtifact("VaultPool");
    const USDT = await hre.artifacts.readArtifact("USDT");

    // Create abi directory if it doesn't exist
    const abiDir = path.join(__dirname, '..', 'abi');
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir);
    }

    // Save ABIs
    fs.writeFileSync(
        path.join(abiDir, 'Share.json'),
        JSON.stringify(Share.abi, null, 2)
    );

    fs.writeFileSync(
        path.join(abiDir, 'StakingPool.json'),
        JSON.stringify(StakingPool.abi, null, 2)
    );

    fs.writeFileSync(
        path.join(abiDir, 'VaultPool.json'),
        JSON.stringify(VaultPool.abi, null, 2)
    );

    fs.writeFileSync(
        path.join(abiDir, 'USDT.json'),
        JSON.stringify(USDT.abi, null, 2)
    );

    console.log("ABIs generated successfully in the 'abi' directory");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 