const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const AMOUNT = "150000000000000000000";
const DOUBLE_AMOUNT = "300000000000000000000";
describe("TokenVault", function () {
  // Common setup for all tests
  async function deployTokenVaultFixture() {
    const [admin, user1, user2] = await ethers.getSigners();
    // Deploy your ERC20 token here
    const Token = await hre.ethers.deployContract("USDT");
    const token = await Token.waitForDeployment();

    const Usyc = await hre.ethers.deployContract("USYC");
    const usyc = await Usyc.waitForDeployment();

    // Deploy your TokenVault here, passing the token address
    const TokenVault = await ethers.getContractFactory("USYCTokenVault");
    console.log("admin", admin.address);
    const tokenVault = await TokenVault.deploy(usyc.target, token.target, admin, "Share", "777");
    await tokenVault.waitForDeployment();

    // Initial token distribution
    await token.mint(user1.address, AMOUNT);
    await token.mint(user2.address, AMOUNT);

    return { admin, user1, user2, token, tokenVault, usyc };
  }
  describe("deployment", function () {
    it("USDT should be the payment token, USYC should be the underlying asset", async function () {
      const { token, tokenVault, usyc } = await loadFixture(deployTokenVaultFixture);
      console.log("USYC", usyc.target);
      console.log("USDT", token.target);
      // Verify that the token address is not zero
      expect(token.target).to.not.equal(0, "Token address is zero");
      // // Verify that the usyc token address is not zero
      expect(usyc.target).to.not.equal(0, "USYC token address is zero");
      // // Additional check to ensure the tokenVault has the correct token addresses set
      const paymentTokenAddress = await tokenVault.paymentToken();
      expect(paymentTokenAddress).to.equal(token.target, "TokenVault paymentToken address does not match");
      const assetAddress = await tokenVault.asset();
      expect(assetAddress).to.equal(usyc.target, "TokenVault asset address does not match");
    });
  });

  describe("preDeposit", function () {
    it("should allow users to pre-deposit tokens", async function () {
      const { user1, user2, token, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
      console.log(await tokenVault.paymentToken());
      console.log(token.target);
      // await token.connect(user1).approve(tokenVault.target, AMOUNT);
      await token.connect(user1).approve(tokenVault.target, AMOUNT);
      expect(await token.balanceOf(user1)).to.equal(AMOUNT);
      await tokenVault.connect(user1).preDeposit(AMOUNT);
      expect(await tokenVault.depositAmount(user1.address)).to.equal(AMOUNT);
      expect(await token.balanceOf(user1)).to.equal("0");
      expect(await token.balanceOf(tokenVault.target)).to.equal(AMOUNT);
      // user 2 flow
      await token.connect(user2).approve(tokenVault.target, AMOUNT);
      expect(await token.balanceOf(user2)).to.equal(AMOUNT);
      await tokenVault.connect(user2).preDeposit(AMOUNT);
      expect(await tokenVault.depositAmount(user2.address)).to.equal(AMOUNT);
      expect(await token.balanceOf(user2)).to.equal("0");
      expect(await token.balanceOf(tokenVault.target)).to.equal(DOUBLE_AMOUNT);
    });
  });
  describe("USYCTokenVault deposit process", function () {
    it("should correctly set pendingDeposits and depositConfirmed mappings after a deposit", async function () {
      const { user2, user1, token, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
      // User1 approves tokenVault to spend their tokens and makes a pre-deposit
      const depositAmount = AMOUNT;
      await token.connect(user1).approve(tokenVault.target, depositAmount);
      await tokenVault.connect(user1).preDeposit(depositAmount);
      await token.connect(user2).approve(tokenVault.target, depositAmount);
      await tokenVault.connect(user2).preDeposit(depositAmount);
      //preDeposit
      expect(await tokenVault.depositAmount(user1.address)).equal(depositAmount);
      expect(await tokenVault.status(user1.address)).equal("DepositPending");
      expect(await tokenVault.depositAmount(user1.address)).equal(AMOUNT);
      expect(await tokenVault.pendingDepositAddresses(0)).equal(user1.address);
      expect(await tokenVault.depositAmount(user2.address)).equal(depositAmount);
      expect(await tokenVault.status(user2.address)).equal("DepositPending");
      expect(await tokenVault.depositAmount(user2.address)).equal(AMOUNT);
      expect(await tokenVault.pendingDepositAddresses(1)).equal(user2.address);
      // executeDeposit
      await tokenVault.connect(admin).executeDeposit();
      expect(await tokenVault.status(user1.address)).equal("DepositConfirmed");
      expect(await tokenVault.depositAmount(user1.address)).equal(0);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT);
      expect(await tokenVault.depositAmount(user2.address)).equal(0);
      expect(await tokenVault.status(user2.address)).equal("DepositConfirmed");
      expect(await tokenVault.balanceOf(user2.address)).equal(AMOUNT);
      // preWithdraw
      await tokenVault.connect(user1).preWithdraw(AMOUNT);
      expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(AMOUNT);
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      expect(await tokenVault.pendingWithdrawAddresses(0)).equal(user1.address);
      await tokenVault.connect(user2).preWithdraw(5);
      expect(await tokenVault.shareAmountToRedeem(user2.address)).equal(5);
      expect(await tokenVault.balanceOf(user2.address)).equal("149999999999999999995");
      expect(await tokenVault.pendingWithdrawAddresses(0)).equal(user1.address);
      await tokenVault.connect(user2).preWithdraw(100000);
      expect(await tokenVault.shareAmountToRedeem(user2.address)).equal(100005);
      expect(await tokenVault.balanceOf(user2.address)).equal("149999999999999899995");
      expect(await tokenVault.pendingWithdrawAddresses(1)).equal(user2.address);
      // executeWithdraw
      expect(await token.balanceOf(user1)).to.equal(0);
      await tokenVault.connect(admin).executeWithdraw();
      expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(0);
      expect(await tokenVault.status(user1.address)).equal("WithdrawConfirmed");
      expect(await token.balanceOf(user1)).to.equal(AMOUNT);
      let shareAmountToRedeem = await tokenVault.shareAmountToRedeem(user1.address);
      let status = await tokenVault.status(user1.address);
      let paymentToken = await token.balanceOf(user1.address);
      let shares = await tokenVault.balanceOf(user1.address);
      console.log({ shareAmountToRedeem, status, paymentToken, shares });
      // whole flow
      await token.connect(user1).approve(tokenVault.target, depositAmount);
      await tokenVault.connect(user1).preDeposit(5);
      expect(await tokenVault.depositAmount(user1.address)).equal(5);
      await tokenVault.connect(admin).executeDeposit();
      await tokenVault.connect(user1).preWithdraw(3);
      expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(3);
      await tokenVault.connect(user1).preWithdraw(2);
      expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(5);
      await tokenVault.connect(admin).executeWithdraw();
      shareAmountToRedeem = await tokenVault.shareAmountToRedeem(user1.address);
      status = await tokenVault.status(user1.address);
      paymentToken = await token.balanceOf(user1.address);
      shares = await tokenVault.balanceOf(user1.address);
      console.log({ shareAmountToRedeem, status, paymentToken, shares });
    });
  });

  // Additional tests can include various scenarios, such as attempting to deposit more than the allowance,
  // trying to confirm deposit for addresses with no pending deposits, and so on.
});
