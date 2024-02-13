const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert, should } = require("chai");

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

    const share = await ethers.getContractAt("Share", Fund[0]);
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
      await stakingPool.connect(otherAccount).stake("500000000000000000");
      await stakingPool.connect(owner).unstake();
    });
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
      await stakingPool.unstake();
      await stakingPool.stake("500000000000000000");

      const getStakingInfo = await stakingPool.getStakingInfo(owner.address);
      expect(getStakingInfo.length).to.equal(1);
    });

    it("Should be set rate", async function () {
      const { owner, otherAccount, usdt, stakingPool } = await loadFixture(
        deployOneYearLockFixture
      );

      await stakingPool.setRate("1100");
      expect(await stakingPool.rate()).to.equal("1100");
    });

    it("Should be swap token", async function () {
      const { owner, otherAccount, usdt, stakingPool, share } =
        await loadFixture(deployOneYearLockFixture);

      await stakingPool.setRate("11000");
      await stakingPool.connect(otherAccount).stake("1000000000000000000");

      await share.mint([owner.address], ["8000000"]);
      await share.approve(stakingPool.target, "8000000"); // 88
      await stakingPool.swap("8000000");

      expect(await usdt.balanceOf(stakingPool.target)).to.equal(
        "999999999991200000"
      );
      expect(await usdt.balanceOf(owner.address)).to.equal(
        "1000000000008800000"
      );
      expect(await share.balanceOf(otherAccount.address)).to.equal("8000000");
    });
    it("Should be swap token total", async function () {
      const { owner, otherAccount, usdt, stakingPool, share } =
        await loadFixture(deployOneYearLockFixture);

      await stakingPool.setRate("8000");
      await stakingPool.connect(otherAccount).stake("1000000000000000000");

      await share.mint([owner.address], ["1250000000000000000"]);
      await share.approve(stakingPool.target, "1250000000000000000"); // 88
      await stakingPool.swap("1250000000000000000");

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("0");
      expect(await usdt.balanceOf(owner.address)).to.equal(
        "2000000000000000000"
      );
      expect(await share.balanceOf(otherAccount.address)).to.equal(
        "1250000000000000000"
      );
    });
    it("Should be swap token total2", async function () {
      const { owner, otherAccount, usdt, stakingPool, share } =
        await loadFixture(deployOneYearLockFixture);

      await stakingPool.setRate("8000");
      await stakingPool.stake("500000000000000000");
      await stakingPool.connect(otherAccount).stake("500000000000000000");

      await share.mint([owner.address], ["1250000000000000000"]);
      await share.approve(stakingPool.target, "1250000000000000000"); // 88
      await stakingPool.swap("1250000000000000000");

      expect(await usdt.balanceOf(stakingPool.target)).to.equal("0");
      expect(await usdt.balanceOf(owner.address)).to.equal(
        "1500000000000000000"
      );
      expect(await share.balanceOf(otherAccount.address)).to.equal(
        "625000000000000000"
      );
      expect(await share.balanceOf(owner.address)).to.equal(
        "625000000000000000"
      );
    });
    it("Should be swap token error", async function () {
      const { owner, otherAccount, usdt, stakingPool, share } =
        await loadFixture(deployOneYearLockFixture);

      await stakingPool.setRate("9000");
      await stakingPool.connect(otherAccount).stake("1000000000000000000");

      await share.mint([owner.address], ["1000000000000000000"]);
      await share.approve(stakingPool.target, "1000000000000000000"); // 88
      await stakingPool.swap("1000000000000000000")

      const bal = await share.balanceOf(owner.address);
      const usdtbal = await usdt.balanceOf(owner.address);
      expect(bal).to.equal("0");
      expect(usdtbal).to.equal("1900000000000000000");
      // should.(await stakingPool.swap("1250000000000000000")).to.throw("Insufficient balance of issue token")
      // assert.isRejected(await stakingPool.swap("1250000000000000000"), "Insufficient balance of issue token");
    });

    it("Should be redeem RWA share token", async function () {
      const { owner, otherAccount, usdt, vaultPool, share } = await loadFixture(
        deployOneYearLockFixture
      );

      await usdt.transfer(vaultPool.target, "1000000000000000000");
      await share.mint([owner.address],["100000000000000000"]);
      await share.approve(vaultPool.target, "100000000000000000");
      await vaultPool.reedem("100000000000000000");

      expect(await usdt.balanceOf(owner.address)).to.equal("999999999999999990");
      expect(await share.balanceOf(owner.address)).to.equal("0");
    });
    it("Shoule manager can withdraw usdt from vault", async function () {
      const { owner, otherAccount, usdt, vaultPool, share } = await loadFixture(
        deployOneYearLockFixture
      );

      await usdt.connect(otherAccount).transfer(vaultPool.target, "1000000000000000000");
      await vaultPool.withdraw();
      expect(await usdt.balanceOf(owner.address)).to.equal("2000000000000000000");
    });
  });
});
