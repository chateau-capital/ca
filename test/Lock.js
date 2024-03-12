const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert, should } = require("chai");
const { beforeEach } = require("node:test");
const AMOUNT = "150000000000000000000";
const TETHER_STARTING_BALANCE = "600000000000000000000";
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
    const Fund = await factory.newFund.staticCall("RWA", "RWA", usdtCoin.target);
    await factory.newFund("RWA", "RWA", usdtCoin.target);

    const share = await ethers.getContractAt("Share", Fund[0]);
    const usdt = await ethers.getContractAt("USDT", usdtCoin.target);
    const stakingPool = await ethers.getContractAt("StakingPool", Fund[1]);
    const vaultPool = await ethers.getContractAt("VaultPool", Fund[2]);
    const factoryContract = await ethers.getContractAt("Factory", factory.target);
    for (let i = 0; i < allUsers.length; i++) {
      await usdt.connect(allUsers[i]).approve(stakingPool.target, "10000000000000000000000000000000");
      await usdt.mint(allUsers[i], TETHER_STARTING_BALANCE);
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
      const { owner, factoryContract } = await loadFixture(deployOneYearLockFixture);

      expect(await factoryContract.owner()).to.equal(owner.address);
    });
  });

  describe("user staking usdt on staking pool", function () {
    it("Should be able to stake and unstake usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(deployOneYearLockFixture);

      // starting amount in contract
      await usdt.mint(stakingPool.target, "50000000000000000000");
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("50000000000000000000");

      await stakingPool.stake(AMOUNT);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("200000000000000000000");

      await usdt.connect(otherAccount);
      await stakingPool.connect(otherAccount).stake(AMOUNT);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("350000000000000000000");

      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("200000000000000000000");
      //
      await stakingPool.stake(AMOUNT);
      await stakingPool.stake(AMOUNT);
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("500000000000000000000");
      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("200000000000000000000");
    });
    it("Admin should be able to withdraw usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(deployOneYearLockFixture);
      await stakingPool.connect(otherAccount).stake(AMOUNT);
      expect(await usdt.balanceOf(owner.address)).to.equal("600000000000000000000");
      await stakingPool.connect(owner).withdraw();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("0");
      expect(await usdt.balanceOf(owner.address)).to.equal("750000000000000000000");
    });
    it("Should be able to stake and unstake usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(deployOneYearLockFixture);

      await stakingPool.stake(AMOUNT);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT);

      await usdt.connect(otherAccount);

      await stakingPool.connect(otherAccount).stake(AMOUNT);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("300000000000000000000");

      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT);

      await stakingPool.stake(AMOUNT);
      await stakingPool.unstake();
      await stakingPool.stake(AMOUNT);

      const getStakingInfo = await stakingPool.getStakingInfo(owner.address);
      expect(getStakingInfo.length).to.equal(1);
    });
    // TODO test changes for redeem here
    it("Should be redeem RWA share token", async function () {
      const { owner, otherAccount, usdt, vaultPool, share } = await loadFixture(deployOneYearLockFixture);
      expect(await usdt.balanceOf(owner.address)).to.equal(TETHER_STARTING_BALANCE);
      await usdt.transfer(vaultPool.target, AMOUNT);
      await share.mint([owner.address], [AMOUNT]);
      await share.approve(vaultPool.target, "100000000000000000");
      await vaultPool.redeem("100000000000000000");
      expect(await share.balanceOf(owner.address)).to.equal("0");
    });
    it("Should manager can withdraw usdt from vault", async function () {
      const { owner, otherAccount, usdt, vaultPool, share } = await loadFixture(deployOneYearLockFixture);

      await usdt.connect(otherAccount).transfer(vaultPool.target, AMOUNT);
      await vaultPool.withdraw();
      expect(await usdt.balanceOf(owner.address)).to.equal("750000000000000000000");
    });
  });
});
