const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert, should } = require("chai");
const { beforeEach } = require("node:test");
const SHARES = "10000000000000000000"; // 10 shares;
const SHARE = "1000000000000000000"; // 1 shares;

const AMOUNT_TO_STAKE = "10000000"; // 10 tether
const TETHER_STARTING_BALANCE = "1000000000"; // 1000 tether
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
      await usdt.connect(allUsers[i]).approve(stakingPool.target, TETHER_STARTING_BALANCE);
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
      await stakingPool.stake(AMOUNT_TO_STAKE);
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT_TO_STAKE);

      await usdt.connect(otherAccount);
      await stakingPool.connect(otherAccount).stake(AMOUNT_TO_STAKE);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("20000000"); // 20 tether

      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("10000000");
      //
      await stakingPool.stake(AMOUNT_TO_STAKE);
      await stakingPool.stake(AMOUNT_TO_STAKE);
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("30000000");
      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("10000000");
    });
    it("Admin should be able to withdraw usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(deployOneYearLockFixture);
      await stakingPool.connect(otherAccount).stake(AMOUNT_TO_STAKE);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT_TO_STAKE);
      expect(await usdt.balanceOf(owner.address)).to.equal(TETHER_STARTING_BALANCE);
      await stakingPool.connect(owner).withdraw();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal("0");
      expect(await usdt.balanceOf(owner.address)).to.equal("1010000000"); // 1010 tether
    });
    it("Should be able to stake and unstake usdt", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(deployOneYearLockFixture);

      await stakingPool.stake(AMOUNT_TO_STAKE);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT_TO_STAKE);

      await usdt.connect(otherAccount);

      await stakingPool.connect(otherAccount).stake(AMOUNT_TO_STAKE);

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("20000000");

      await stakingPool.unstake();
      expect(await usdt.balanceOf(stakingPool.target)).to.equal(AMOUNT_TO_STAKE);

      await stakingPool.stake(AMOUNT_TO_STAKE);

      await stakingPool.unstake();
      let getStakingInfo = await stakingPool.getStakingInfo(owner.address);
      expect(getStakingInfo.length).to.equal(0);

      await stakingPool.stake(AMOUNT_TO_STAKE);

      getStakingInfo = await stakingPool.getStakingInfo(owner.address);
      expect(getStakingInfo.length).to.equal(1);
    });
    it("Should correctly redeem tether amount", async function () {
      const { owner, otherAccount, usdt, vaultPool, share, stakingPool } = await loadFixture(deployOneYearLockFixture);
      expect(await usdt.balanceOf(otherAccount)).to.equal("1000000000");
      await usdt.mint(vaultPool.target, TETHER_STARTING_BALANCE);
      expect(await usdt.balanceOf(vaultPool)).to.equal(TETHER_STARTING_BALANCE);
      await share.mint([otherAccount], [SHARES]);
      expect(await share.balanceOf(otherAccount)).to.equal(SHARES);
      // await share.approve(otherAccount, SHARES);
      await share.connect(otherAccount).approve(vaultPool.target, SHARES);

      expect(await usdt.balanceOf(otherAccount)).to.equal("1000000000");
      await vaultPool.connect(otherAccount).redeem(SHARE);
      expect(await usdt.balanceOf(otherAccount)).to.equal("1001000000");
    });
    //   it("Should manager can withdraw usdt from vault", async function () {
    //     const { owner, otherAccount, usdt, vaultPool, share } = await loadFixture(deployOneYearLockFixture);
    //     await usdt.connect(otherAccount).transfer(vaultPool.target, AMOUNT);
    //     await vaultPool.withdraw();
    //     expect(await usdt.balanceOf(owner.address)).to.equal("750000000000000000000");
    //   });
  });
});
