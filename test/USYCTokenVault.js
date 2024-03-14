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
      const { user1, user2, token, tokenVault } = await loadFixture(deployTokenVaultFixture);
      await token.connect(user1).approve(tokenVault.target, AMOUNT);
      expect(await token.balanceOf(user1)).to.equal(AMOUNT);
      await tokenVault.connect(user1).preDeposit(AMOUNT);
      expect(await tokenVault.pendingDeposits(user1.address)).to.equal(AMOUNT);
      expect(await token.balanceOf(user1)).to.equal("0");
      console.log(tokenVault.target);
      expect(await token.balanceOf(tokenVault.target)).to.equal(AMOUNT);
      // user 2 flow
      await token.connect(user2).approve(tokenVault.target, AMOUNT);
      expect(await token.balanceOf(user2)).to.equal(AMOUNT);
      await tokenVault.connect(user2).preDeposit(AMOUNT);
      expect(await tokenVault.pendingDeposits(user2.address)).to.equal(AMOUNT);
      expect(await token.balanceOf(user2)).to.equal("0");
      expect(await token.balanceOf(tokenVault.target)).to.equal(DOUBLE_AMOUNT);
    });
  });
  describe("USYCTokenVault deposit process", function () {
    it("should correctly set pendingDeposits and depositConfirmed mappings after a deposit", async function () {
      const { user1, token, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
      // User1 approves tokenVault to spend their tokens and makes a pre-deposit
      const depositAmount = AMOUNT;
      await token.connect(user1).approve(tokenVault.target, depositAmount);
      await tokenVault.connect(user1).preDeposit(depositAmount);
      // Verify that pendingDeposits for user1 is correctly set
      expect(await tokenVault.pendingDeposits(user1.address)).to.equal(depositAmount);
      expect(await tokenVault.depositConfirmed(user1.address)).to.be.false;
      // Admin confirms the deposit
      await tokenVault.connect(admin).adminConfirmDeposit([user1.address]);
      // Verify that depositConfirmed for user1 is correctly set
      expect(await tokenVault.depositConfirmed(user1.address)).to.be.true;
      // Reset check for pendingDeposits to ensure it's set back to 0
      expect(await tokenVault.pendingDeposits(user1.address)).to.equal(0);
    });
  });

  describe("adminConfirmDeposit", function () {
    it("should allow admin to confirm deposits and distribute shares", async function () {
      const { admin, user1, token, tokenVault } = await loadFixture(deployTokenVaultFixture);
      // Pre-deposit setup
      const depositAmount = AMOUNT;
      await token.connect(user1).approve(tokenVault.target, depositAmount);
      await tokenVault.connect(user1).preDeposit(depositAmount);

      // Confirm deposit
      await tokenVault.connect(admin).adminConfirmDeposit([user1.address]);

      // Verify shares distribution
      const shares = await tokenVault.balanceOf(user1.address);
      expect(shares).to.be.gt(0); // Assumes _convertToShares logic issues shares > 0 for the deposit
      expect(await tokenVault.pendingDeposits(user1.address)).to.equal(0);
      expect(await tokenVault.depositConfirmed(user1.address)).to.equal(true);
    });

    //   it("should not allow non-admin to confirm deposits", async function () {
    //     const { user1, user2, token, tokenVault } = await loadFixture(deployTokenVaultFixture);

    //     // Attempt by non-admin to confirm deposit
    //     await expect(tokenVault.connect(user2).adminConfirmDeposit([user1.address])).to.be.revertedWith("Not admin"); // Assumes your contract uses this revert message for non-admin actions
    //   });
  });

  it("should emit a DepositsConfirmed event upon confirming deposits for multiple users", async function () {
    const { admin, user1, user2, token, tokenVault } = await loadFixture(deployTokenVaultFixture);
    // User1 and User2 approve tokenVault for an amount and make a preDeposit
    await token.connect(user1).approve(tokenVault.target, AMOUNT);
    await tokenVault.connect(user1).preDeposit(AMOUNT);
    await token.connect(user2).approve(tokenVault.target, AMOUNT);
    await tokenVault.connect(user2).preDeposit(AMOUNT);
    // Expect the transaction to emit a DepositsConfirmed event with specific parameters for both users
    await expect(tokenVault.connect(admin).adminConfirmDeposit([user1.address]))
      .to.emit(tokenVault, "DepositsConfirmed")
      .withArgs(user1.address, AMOUNT, AMOUNT);
  });

  // Additional tests can include various scenarios, such as attempting to deposit more than the allowance,
  // trying to confirm deposit for addresses with no pending deposits, and so on.
});
