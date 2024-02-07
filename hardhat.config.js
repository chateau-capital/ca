require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
    //     blockNumber: 13000000,
    //   },
    // },
    // sepolia: {
    //   url: process.env.SEPOLIA_URL,
    //   accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    // },
    // bera: {
    //   url: "https://artio.rpc.berachain.com/",
    //   chainId: 80085,
    //   accounts: [
    //     "",
    //   ],
    // },
    arbitrumSepolia: {
      url: `${process.env.ARB_SEPOLIA_NODE}${process.env.ARB_SEPOLIA_ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
      // chainId: process.env.ARB_SEPLIA_CHAIN_ID,
      gasPrice: 1_600_000_000,
      tags: ["arbitrumSepolia"],
    },
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: {
      etherscan: process.env.ETHERSCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBSCAN_APIKEY || "",
   },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
};
