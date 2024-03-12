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
    // sepolia: {
    //   url: process.env.SEPOLIA_URL,
    //   accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    // },
    // arbitrumOne:{
    //   url: `https://1rpc.io/arb`,
    //   accounts: [process.env.PRIVATE_KEY],
    //   saveDeployments: true,
    //   tags: ["arbitrum"],
    // },
    // arbitrumSepolia: {
    //   url: `${process.env.ARB_SEPOLIA_NODE}${process.env.ARB_SEPOLIA_ALCHEMY_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY],
    //   saveDeployments: true,
    //   tags: ["arbitrumSepolia"],
    // },
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      etherscan: process.env.ETHERSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBSCAN_APIKEY || "",
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
