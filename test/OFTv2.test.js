const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OFTv2 Contracts", function () {
  let usdcOFTv2;
  let factoryOFTv2;
  let shareToken;
  let stakingPool;
  let vaultPool;
  let owner;
  let user1;
  let user2;
  let lzEndpoint;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // LayerZero endpoint for local testing
    lzEndpoint = "0x0000000000000000000000000000000000000000";

    // Deploy USDC OFTv2
    const USDCOFTv2 = await ethers.getContractFactory("USDCOFTv2");
    usdcOFTv2 = await USDCOFTv2.deploy(lzEndpoint);
    await usdcOFTv2.waitForDeployment();

    // Deploy Factory OFTv2
    const FactoryOFTv2 = await ethers.getContractFactory("FactoryOFTv2");
    factoryOFTv2 = await FactoryOFTv2.deploy(owner.address, lzEndpoint);
    await factoryOFTv2.waitForDeployment();

    // Create a new fund
    const fundName = "Test Fund";
    const fundTicker = "TEST";
    const tx = await factoryOFTv2.newFund(fundName, fundTicker, usdcOFTv2.target);
    const receipt = await tx.wait();

    // Get the deployed contracts
    const shareTokenAddress = await factoryOFTv2.getShareToken(fundTicker);
    const stakingPoolAddress = await factoryOFTv2.getStakingPool(shareTokenAddress);
    const vaultPoolAddress = await factoryOFTv2.getVaultPool(shareTokenAddress);

    shareToken = await ethers.getContractAt("ShareOFTv2", shareTokenAddress);
    stakingPool = await ethers.getContractAt("StakingPool", stakingPoolAddress);
    vaultPool = await ethers.getContractAt("VaultPool", vaultPoolAddress);

    // Mint some USDC to users for testing
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    await usdcOFTv2.mint(user1.address, mintAmount);
    await usdcOFTv2.mint(user2.address, mintAmount);
  });

  describe("USDC OFTv2", function () {
    it("Should have correct name and symbol", async function () {
      expect(await usdcOFTv2.name()).to.equal("USD Coin");
      expect(await usdcOFTv2.symbol()).to.equal("USDC");
      expect(await usdcOFTv2.decimals()).to.equal(6);
    });

    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdcOFTv2.mint(user1.address, amount);
      expect(await usdcOFTv2.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        usdcOFTv2.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Share OFTv2", function () {
    it("Should have correct name and symbol", async function () {
      expect(await shareToken.name()).to.equal("Test Fund");
      expect(await shareToken.symbol()).to.equal("TEST");
    });

    it("Should allow vault to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await shareToken.connect(stakingPool).mint(user1.address, amount);
      expect(await shareToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should not allow non-vault to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        shareToken.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Staking Pool", function () {
    it("Should allow users to stake USDC", async function () {
      const stakeAmount = ethers.parseUnits("100", 6);
      await usdcOFTv2.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(stakeAmount);
      
      // Check USDC balance
      expect(await usdcOFTv2.balanceOf(stakingPool.target)).to.equal(stakeAmount);
      
      // Check Share token balance
      const expectedShares = ethers.parseUnits("100", 18); // 1:1 ratio for simplicity
      expect(await shareToken.balanceOf(user1.address)).to.equal(expectedShares);
    });
  });

  describe("Vault Pool", function () {
    it("Should allow users to redeem Share tokens", async function () {
      // First stake some USDC
      const stakeAmount = ethers.parseUnits("100", 6);
      await usdcOFTv2.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(stakeAmount);
      
      // Then redeem the Share tokens
      const shareBalance = await shareToken.balanceOf(user1.address);
      await shareToken.connect(user1).approve(vaultPool.target, shareBalance);
      await vaultPool.connect(user1).redeem();
      
      // Check balances
      expect(await shareToken.balanceOf(user1.address)).to.equal(0);
      expect(await usdcOFTv2.balanceOf(user1.address)).to.equal(stakeAmount);
    });
  });
}); 