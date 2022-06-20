# Proxy Erc20 Deployer

This repo aim to make it easy for user to deploy ckb layer 1 sudt token to layer 2 once you have `args` of sudt token on ckb layer 1.

Then user can deposit token from layer 1 to layer 2, or withdraw token from layer 2 to layer 1 via Godwoken Bridge.

## Quick Start

```sh
yarn
npx hardhat compile
<replace with your private key in .env file>
<change your token config in main.js line 16-24>
npx hardhat run scripts/main.js
```

Change deploy config in [main.js](https://github.com/zhangyouxin/night-godwoken/blob/master/scripts/main.js#L16-L24) to deploy your token to Godwoken v0/v1.

## Known Issue

- Currently we always get a zero when fetching balance from layer2
