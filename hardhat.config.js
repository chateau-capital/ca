require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
  }
  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
    //     blockNumber: 13000000,
    //   },
    // },
    // sepolia:{
    //   url: process.env.SEPOLIA_URL,
    //   accounts:[process.env.SEPOLIA_PRIVATE_KEY]
    // },
    // bera:{
    //   url:"https://artio.rpc.berachain.com/",
    //   chainId:80085,
    //   accounts:["0xd31f35273e9623698f8ca3a28cb6999120103599bf60a78ef915d5c8424eceef"]
    // }
  // etherscan:{
  //   apiKey: process.env.ETHERSCAN_API_KEY
  // }
};
