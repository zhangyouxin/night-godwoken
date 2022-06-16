## Proxy Erc20 Deployer

This repo aim to make it easy for user to deploy ckb layer 1 sudt token to layer 2 once you have `args` of sudt token on ckb layer 1.

Then user can deposit token from layer 1 to layer 2, or withdraw token from layer 2 to layer 1 via Godwoken Bridge.

### Quick Start

```
yarn
npx hardhat compile
node scirpts/main.js
```

Change deploy config in main.js to deploy your token to Godwoken v0/v1.