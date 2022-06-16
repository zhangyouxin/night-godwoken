require("@nomiclabs/hardhat-waffle");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "v1",
  networks: {
    v0: {
      url: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
      accounts: ["0x3d69ab5c6b220ac1a03ec920d0fef5d4348c2a141e5c3b57be9bb87f074fa7bf"]
    },
    v1: {
      url: "https://godwoken-testnet-v1.ckbapp.dev",
      accounts: ["0x3d69ab5c6b220ac1a03ec920d0fef5d4348c2a141e5c3b57be9bb87f074fa7bf"]
    },
  },
};

