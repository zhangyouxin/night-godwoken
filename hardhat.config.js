require("@nomiclabs/hardhat-waffle");
const fs = require('fs')
const privateKey = fs.readFileSync('./.env').toString()
console.log('PrivateKey', privateKey);
if(!privateKey){
  throw new Error("Please add your private key in .env file");
}
process.env.PRIVATE_KEY = privateKey
// console.log('process', process.env);
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "v0",
  networks: {
    v0: {
      url: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
      accounts: [privateKey]
    },
    v1: {
      url: "https://godwoken-testnet-v1.ckbapp.dev",
      accounts: [privateKey]
    },
  },
};

