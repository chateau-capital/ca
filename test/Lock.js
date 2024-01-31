const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const allUsers = await ethers.getSigners();
    const [owner, otherAccount] = await ethers.getSigners();

    const USDTCoin = await hre.ethers.deployContract("USDT");
    const usdtCoin = await USDTCoin.waitForDeployment();

    const QuadReaderUtils = await hre.ethers.deployContract("QuadReaderUtils");
    const quadReaderUtils = await QuadReaderUtils.waitForDeployment();

    const Factory = await hre.ethers.deployContract("Factory");
    const factory = await Factory.waitForDeployment();

    const Fund = await factory.newFund.staticCall(
      "RWA",
      "RWA",
      usdtCoin.target
    );
    await factory.newFund("RWA", "RWA", usdtCoin.target);

    const share = await ethers.getContractAt("ERC20", Fund[0]);
    const usdt = await ethers.getContractAt("USDT", usdtCoin.target);
    const stakingPool = await ethers.getContractAt("StakingPool", Fund[1]);
    const vaultPool = await ethers.getContractAt("VaultPool", Fund[2]);
    const factoryContract = await ethers.getContractAt(
      "Factory",
      factory.target
    );

    for (let i = 0; i < allUsers.length; i++) {
      await usdt
        .connect(allUsers[i])
        .approve(stakingPool.target, "10000000000000000000000000000");
      await usdt.mint(allUsers[i], "1000000000000000000");
    }

    return {
      owner,
      otherAccount,
      share,
      usdt,
      stakingPool,
      vaultPool,
      factoryContract,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { owner, factoryContract } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await factoryContract.owner()).to.equal(owner.address);
    });
  });

  describe("user staking usdt on staking pool", function () {
    it("Should be able to stake and unstake usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(
        deployOneYearLockFixture
      );

      await stakingPool.stake("500000000000000000");

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "500000000000000000"
      );

      await usdt.connect(otherAccount);

      await stakingPool.connect(otherAccount).stake("1000000000000000000");

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "1500000000000000000"
      );

      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "1000000000000000000"
      );

      await stakingPool.stake("500000000000000000");
      await stakingPool.stake("500000000000000000");
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "2000000000000000000"
      );
      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "1000000000000000000"
      );
    });
    it("Admin should be able to withdraw usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(
        deployOneYearLockFixture
      );

      await stakingPool.connect(otherAccount).stake("500000000000000000");
      await stakingPool.connect(owner).withdraw();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("0");
      expect(await usdt.balanceOf(owner.address)).to.equal(
        "1500000000000000000"
      );
    });
  });
});
