// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const originalEthers = require("ethers");
const { utils, config } = require("@ckb-lumos/lumos");
const axios = require("axios").default;
const NETWORK_CONFIG = require("./config.json");
const polyjuce = require("@polyjuice-provider/ethers");
const fs = require('fs')
const path = require('path')

// change config below to deploy your proxy erc20
main(
  {
    tokenName: "Wrapped DAI (ForceBridge from Ethereum)",
    tokenSymbol: "DAI|eth",
    tokenL1LockArgs: "0xcb8c7b352d88142993bae0f6a1cfc0ec0deac41e3377a2f7038ff6b103548353",
    tokenDecimals: 18,
  },
  "v0"
);

async function main(options, version) {
  const config = NETWORK_CONFIG[version];
  const rpcUrl = hre.config.networks[version].url;
  console.log("Version is:", version);
  console.log("Godwoken config is:", config);
  console.log("RpcUrl is:", rpcUrl);
  const sudtL2LockHash = await getSudtL2LockHash(
    config.rollupTypeHash,
    config.l2ProxyErc20CodeHash,
    options.tokenL1LockArgs
  );
  const sudtId = await getSudtId(rpcUrl, sudtL2LockHash);
  if (!sudtId) {
    throw new Error("sudtId is null, please deposit token to godwoken first.");
  }
  const tokenAddress = await deployErc20(
    version,
    options.tokenName,
    options.tokenSymbol,
    sudtId,
    options.tokenDecimals
  );
  const myAddress = (await hre.ethers.getSigner()).address;
  await getBalance(tokenAddress, myAddress);
}

async function getSudtL2LockHash(
  rollupTypeHash,
  l2ProxyErc20CodeHash,
  sudtL1LockArgs
) {
  const sudtL1Lock = {
    code_hash: config.predefined.AGGRON4.SCRIPTS.SUDT.CODE_HASH,
    hash_type: config.predefined.AGGRON4.SCRIPTS.SUDT.HASH_TYPE,
    args: sudtL1LockArgs,
  };
  const sudtL1LockHash = utils.computeScriptHash(sudtL1Lock);
  const sudtL2Lock = {
    code_hash: l2ProxyErc20CodeHash,
    hash_type: "type",
    args: rollupTypeHash + sudtL1LockHash.slice(2),
  };
  const sudtL2LockHash = utils.computeScriptHash(sudtL2Lock);
  return sudtL2LockHash;
}

async function getSudtId(rpcUrl, sudtL2LockHash) {
  const axiosInstance = axios.create({
    baseURL: rpcUrl,
  });
  const result = await axiosInstance.post("/", {
    method: "gw_get_account_id_by_script_hash",
    jsonrpc: "2.0",
    params: [sudtL2LockHash],
    id: "1",
  });
  const sudtId = result.data.result;
  console.log("Sudt Id is:", sudtId);
  return sudtId;
}

async function deployErc20(version, tokenName, tokenSymbol, tokenSudtId, tokenDecimals) {
  let result
  if(version === 'v1') {
    result = await deployV1Erc20(tokenName, tokenSymbol, tokenSudtId, tokenDecimals)
  } else if(version === 'v0') {
    result = await deployV0Erc20(tokenName, tokenSymbol, tokenSudtId, tokenDecimals)
  } else {
    throw new Error(`version ${version} is not supported, please use v1 or v0`);
  }
  return result
}

async function deployV1Erc20(tokenName, tokenSymbol, tokenSudtId, tokenDecimals) {
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy(
    tokenName,
    tokenSymbol,
    9999999999,
    tokenSudtId,
    tokenDecimals
  );
  console.log("Contract address is:", erc20.address);
  const contract = await erc20.deployed();
  console.log("Deploy contract success! Token address is:", contract.address);
  return contract.address;
}

async function deployV0Erc20(tokenName, tokenSymbol, tokenSudtId, tokenDecimals) {
  const v0url = hre.config.networks['v0'].url;
  const customHttpProvider = new polyjuce.PolyjuiceJsonRpcProvider({web3Url: v0url}, v0url);
  const account = process.env.PRIVATE_KEY;
  if(!account){
    throw new Error("Please add your private key in .env file");
  }
  const customSigner = new polyjuce.PolyjuiceWallet(account, {web3Url: v0url}, customHttpProvider);
  const abi = require('../bin-v0/SudtERC20Proxy.json')
  let binary = fs.readFileSync(path.resolve(process.env.PWD, './bin-v0/SudtERC20Proxy_UserDefinedDecimals.bin'), { encoding: 'utf-8' }).toString();
  let ERC20 = new originalEthers.ContractFactory(abi, binary, customSigner);
  await customSigner.godwoker.init();
  const deployArgs = [
    tokenName,
    tokenSymbol,
    9999999999,
    tokenSudtId,
    tokenDecimals
  ];
  const newDeployArgs = await customSigner.convertDeployArgs(
    deployArgs,
    abi,
    binary
  );
  console.log("DeployArgs is:", newDeployArgs);
  const unsignedTx = ERC20.getDeployTransaction(...newDeployArgs);
  unsignedTx.gasPrice = 0;
  unsignedTx.gasLimit = 1_000_000;
  const txResult = await customSigner.sendTransaction(unsignedTx);
  const receipt = await txResult.wait();
  console.log("Contract deploy success! Token address is:", receipt.contractAddress);
  return receipt.contractAddress;
}

async function getBalance(
  tokenAddress,
  userAddress
) {
  const ERC20 = await hre.ethers.getContractAt("ERC20V0", tokenAddress);
  const sudtId = await ERC20.sudtId();
  console.log("Fetching token balance on layer 2...",);
  console.log("SudtId is:", sudtId);
  console.log('User: ', userAddress , "Token address: ", tokenAddress, "Balance is: ", await ERC20.callStatic.balanceOf(userAddress));

}
