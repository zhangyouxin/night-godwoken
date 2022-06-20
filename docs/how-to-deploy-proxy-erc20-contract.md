# 在 Godwoken Testnet V1 上部署 ProxyERC20 合约

**注意！ 首先需要把 layer 1 的 sUDT deposit 到 layer 2 再去部署合约，否则有可能找不到 sudt Id**

## sudt Id

目前在 layer 1 上已经有一些 sUDT 是可以使用的，为了在 layer 2 上使用 sUDT 需要部署对应的 ProxyERC20 合约来与之交互。那么部署合约之前需要知道 sUDT 在 layer 2 对应的 sudt Id


### Layer 1 上的 sUDT 的 Type Script Hash

- 这个可以在 layer 1 上自己发行，或者查询已知 sUDT 的 type hash

### Layer 2 的 Rollup Script Hash

- 可以通过 rpc 获取：

```jsx
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "poly_getChainInfo",
    "params": []
}
// testnet v1 的结果：
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "rollupScriptHash": "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a575",
        "rollupConfigHash": null,
        "ethAccountLockTypeHash": "0x10571f91073fdc3cdef4ddad96b4204dd30d6355f3dda9a6d7fc0fa0326408da",
        "polyjuiceContractTypeHash": "0x8755bcc380e3494b6a2ca9657d16fd2254f7570731c4b87867ed8b747b1b3457",
        "polyjuiceCreatorId": "6",
        "chainId": "868455272153094"
    }
}
```

### Layer 2 的 sUDT Code Hash

因为 layer 2 上的 ckb 也是 sUDT，可以通过 RPC 查询 ckb 的 code hash 得到。

- 第一步先找到 ckb 的 type  script hash：

```jsx
{
    "method": "gw_get_script_hash",
    "jsonrpc": "2.0",
    "params": [
        "0x1" //这里填 1 代表查询的是 ckb 的 type hash
    ],
    "id": "1"
}
// testnet v1 的返回值：
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": "0xb83fb2e013d17e2aba15bc815f14d12195b4ce602686232705875167da9940a8"
}
```

- 第二步，通过上一步拿到的 type script hash 来查询 script：

```jsx
{
    "method": "gw_get_script",
    "jsonrpc": "2.0",
    "params": [
				// 下面填入上一步查到的 type script hash
        "0xb83fb2e013d17e2aba15bc815f14d12195b4ce602686232705875167da9940a8"
    ],
    "id": "1"
}
//testnet v1 的返回值：
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": {
				// 这里的 code_hash 就是 <layer_2_code_hash> 了
        "code_hash": "0xe3e86ae888b3df3328842d11708b8ac30a7385c9f60d67f64efec65b7129e78e",
        "hash_type": "type",
        "args": "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a5750000000000000000000000000000000000000000000000000000000000000000"
    }
}
```

通过以上步骤，可以拼出一个 Layer 2 sUDT Script，并查询 sudt Id

```jsx
Layer2SudtScript: {
	code_hash: <layer_2_code_hash>,
	hash_type: "type",
	args: <layer_2_rollup_type_hash> + <layer_1_sUDT_type_hash>
}

// 计算其 Script Hash
var layer2SudtScriptHash = utils.computeScriptHash(<Layer2SudtScript>)

// 通过 RPC 请求拿到 sudt_id
{
    "method": "gw_get_account_id_by_script_hash",
    "jsonrpc": "2.0",
    "params": [<layer2SudtScriptHash>],
    "id": "1"
}

// testnet v1 上的 usdc 示例返回值：
{
    "jsonrpc": "2.0",
    "id": "1",
    // 这个 result 就是我们要找的 sudt id
    "result": "0x9fe"
}
```

有了 sudt id 之后可以使用 [合约](https://github.com/nervosnetwork/godwoken-polyjuice/blob/main/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.sol) 和 hardhat 来部署到 Godwoken v1 链上：

```jsx
// 合约部署需要填入 5 个参数
// string name,
// string symbol,
// uint256 totalSupply,
// uint256 sudtId,
// uint8 decimals

async function deploy() {
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  // 这里注意 第四个参数填 sudt Id
  const erc20 = await ERC20.deploy("TestToken", "TTN", 9999999999, "0x9fe", 18);
  await erc20.deployed();
  console.log("erc20 deployed to:", erc20.address);
}
```

注意！Godwoken v0 没有完全兼容 Ethereum，所以在部署合约的时候需要使用一些插件，使用详情：[链接](https://github.com/nervosnetwork/polyjuice-provider)

上一步已经打印除了合约的地址，接下来可以查询余额：

```js
async function balance() {
  const ERC20 = await hre.ethers.getContractAt("ERC20",<YOUR_CONTRACT_ADDRESS>);
  const sudtId = await ERC20.sudtId()
  console.log("sudtId is:", sudtId)
  // 注意！因为 ProxyERC20 合约的 balanceOf 的 modifier 不是 view， 这里不能直接调用 ERC20.balanceOf
  console.log(await ERC20.callStatic.balanceOf(<YOUR_ETH_ADDRESS>)
}
```
