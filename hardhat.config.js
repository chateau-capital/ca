require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
    //     blockNumber: 13000000,
    //   },
    // },
    sepolia:{
      url: process.env.SEPOLIA_URL,
      accounts:[process.env.SEPOLIA_PRIVATE_KEY]
    },
    bera:{
      url:"https://rpc.ankr.com/berachain_testnet",
      accounts:[process.env.SEPOLIA_PRIVATE_KEY]
    }
  },
  etherscan:{
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
