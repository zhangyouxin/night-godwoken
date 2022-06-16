const { expect } = require("chai");

describe("ERC20", function() {
  it("Should contract deployed", async function() {
    const ERC20 = await ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy("Token Name", "TOKEN", 100, 0, 18);
    console.log("erc20 is:", erc20.address);
    const contract = await erc20.deployed();
    expect(erc20.address).to.equal(contract.address);
  });
});
