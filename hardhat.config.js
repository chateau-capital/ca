require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");
require("@nomicfoundation/hardhat-verify");

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
    arbitrumOne: {
      url: `${process.env.ARB_NODE}${process.env.ARB_ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
      tags: ["arbitrum"],
    },
    fantom: {
      url: "https://rpcapi.fantom.network",
      accounts: [process.env.FTM_PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },

    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/Q-5WE2Dr5yWuYKOTxBbeK620WE_gnlWG",
      accounts: [process.env.PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },
    // neondevnet: {
    //   url: "https://devnet.neonevm.org",
    //   accounts: [process.env.PRIVATE_KEY],
    //   chainId: 245022926,
    // },
    // neonmainnet: {
    //   url: "https://neon-proxy-mainnet.solana.p2p.org",
    //   accounts: [process.env.PRIVATE_KEY],
    //   chainId: 245022934,
    // },
    // arbitrumSepolia: {
    //   url: `${process.env.ARB_SEPOLIA_NODE}${process.env.ARB_SEPOLIA_ALCHEMY_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY],
    //   saveDeployments: true,
    //   tags: ["arbitrumSepolia"],
    // },
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      // neonevm: "test",
      // sepolia: process.env.ETHERSCAN_API_KEY || "",
      // etherscan: process.env.ETHERSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBSCAN_APIKEY || "",
      // arbitrumSepolia: process.env.ARBSCAN_APIKEY || "",
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
      {
        network: "neonevm",
        chainId: 245022926,
        urls: {
          apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
          browserURL: "https://devnet.neonscan.org",
        },
      },
      {
        network: "neonevm",
        chainId: 245022934,
        urls: {
          apiURL: "https://api.neonscan.org/hardhat/verify",
          browserURL: "https://neonscan.org",
        },
      },
    ],
  },
};
