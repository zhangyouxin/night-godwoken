// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { utils, config, hd } = require("@ckb-lumos/lumos");
const axios = require("axios").default;
const NETWORK_CONFIG = require("./config.json");

async function main(options, version) {
  const config = NETWORK_CONFIG[version];
  console.log("config is:", config);
  const rpcUrl = hre.config.networks[version].url;
  console.log("rpcUrl is:", rpcUrl);
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
    options.tokenName,
    options.tokenSymbol,
    sudtId,
    options.tokenDecimals
  );
  const myAddress = (await hre.ethers.getSigner()).address;
  await getBalance(tokenAddress, myAddress);
}

// change config below to deploy your proxy erc20
main(
  {
    tokenName: "DAI Token",
    tokenSymbol: "DAI",
    tokenL1LockArgs: "0xcb8c7b352d88142993bae0f6a1cfc0ec0deac41e3377a2f7038ff6b103548353",
    tokenDecimals: 18,
  },
  "v1"// TODO: problem is: can't get SUDT id from v0
);

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
  console.log("sudtL2LockHash is:", sudtL2LockHash);
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
  console.log("sudtId is:", sudtId);
  return sudtId;
}

async function deployErc20(tokenName, tokenSymbol, tokenSudtId, tokenDecimals) {
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy(
    tokenName,
    tokenSymbol,
    9999999999,
    tokenSudtId,
    tokenDecimals
  );
  console.log("erc20 is:", erc20);
  const contract = await erc20.deployed();
  console.log("erc20 address is:", contract.address);
  return contract.address;
}

async function getBalance(
  tokenAddress,
  userAddress
) {
  const ERC20 = await hre.ethers.getContractAt("ERC20", tokenAddress);
  const sudtId = await ERC20.sudtId();
  console.log("sudtId is:", sudtId);
  console.log(await ERC20.callStatic.balanceOf(userAddress));
}
