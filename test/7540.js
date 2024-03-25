const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const AMOUNT = "150000000000000000000";
// const DOUBLE_AMOUNT = "300000000000000000000";
const AMOUNT_TO_STAKE = "10000000"; // 10 tether
const TETHER_STARTING_BALANCE = "1000000000"; // 1000 tether
describe("TokenVault", function () {
  async function deployTokenVaultFixture() {
    const [admin, user1, user2] = await ethers.getSigners();
    const Token = await hre.ethers.deployContract("USDT");
    const paymentToken = await Token.waitForDeployment();
    const Share = await ethers.getContractFactory("Share");
    const share = await Share.deploy("Share", "SHARE");
    const d7540 = await ethers.getContractFactory("TokenVault");
    const tokenVault = await d7540.deploy(share.target, paymentToken.target, admin.address);

    await paymentToken.mint(user1.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(user1).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    await paymentToken.mint(user2.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(user2).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    await paymentToken.mint(admin.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(admin).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    return { admin, user1, user2, paymentToken, tokenVault, share };
  }
  describe("deployment", function () {
    it("USDC should be the payment token, Share should be the share token", async function () {
      const { tokenVault, usyc, paymentToken, share } = await loadFixture(deployTokenVaultFixture);
      expect(paymentToken.target).to.not.equal(0, "Token address is zero");
      expect(await tokenVault.paymentToken()).equal(paymentToken.target);
      expect(await tokenVault.asset()).equal(share.target);
    });
  });
  describe("requestDeposit", function () {
    it("should transfer the correct amount, add a deposit record, and emit an event", async function () {
      const { user1, user2, paymentToken, tokenVault } = await loadFixture(deployTokenVaultFixture);

      // Pre-checks
      // const initialBalanceReceiver = await paymentToken.balanceOf(user2.address);
      const initialDepositRecord = await tokenVault.depositRecords(user1.address); // Adjust according to how you access deposit records

      // depositor
      expect(initialDepositRecord[0]).equal("0x0000000000000000000000000000000000000000");
      // receiver
      expect(initialDepositRecord[1]).equal("0x0000000000000000000000000000000000000000");
      // asset amount deposited
      expect(initialDepositRecord[2]).equal(0n);
      // complete
      expect(initialDepositRecord[3]).equal("");

      expect(await paymentToken.balanceOf(user1.address)).to.equal(TETHER_STARTING_BALANCE);
      // Listen for the event
      await expect(await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "DepositRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, AMOUNT_TO_STAKE); // Adjust arguments as necessary

      // Post-checks: Verify the balance of the receiver has increased by AMOUNT
      expect(await paymentToken.balanceOf(user1.address)).to.equal("990000000"); // this test should be lower TETHER_STARTING_BALANCE

      // verify a user can fetch their record
      const userDepositId = await tokenVault.userDepositRecord(user1.address); // Adjust according to how you access deposit records
      expect(userDepositId).equal(1n);

      const depositRecord = await tokenVault.depositRecords(userDepositId); // Adjust according to how you access deposit records
      // depositor
      expect(depositRecord[0]).equal(user1.address);
      // receiver
      expect(depositRecord[1]).equal(user1.address);
      // asset amount deposited
      expect(depositRecord[2]).equal(AMOUNT_TO_STAKE);
      // complete
      expect(depositRecord[3]).equal(1);
      // expect(newDepositRecord).to.not.equal(initialDepositRecord);
    });
  });
  describe("requestRedeem", function () {
    it("should burn the correct amount of shares, add a redeem record, and emit an event", async function () {
      const { user1, tokenVault, share, admin } = await loadFixture(deployTokenVaultFixture);

      // Pre-checks
      // const initialBalanceReceiver = await paymentToken.balanceOf(user2.address);
      const initialDepositRecord = await tokenVault.depositRecords(user1.address); // Adjust according to how you access deposit records
      // Setup: Assume user1 has shares to redeem.
      // This requires user1 to have a balance of the share token.
      // For simplicity, let's assume shares are minted directly for the purpose of this test.
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares

      // Pre-checks
      // const initialSharesBalance = await tokenVault.balanceOf(user1.address);
      // expect(initialSharesBalance).to.equal(SHARES_TO_REDEEM);

      // await tokenVault.deposit();
      // // Execute requestRedeem
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_STAKE);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      expect(await tokenVault.connect(user1).requestRedeem(AMOUNT_TO_STAKE, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "RedeemRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, SHARES_TO_REDEEM); // Adjust args as necessary
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      // // // Post-checks: Verify the shares balance of user1 has decreased by SHARES_TO_REDEEM

      // // // Verify a redeem record was added
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);
      expect(userRedeemId).to.equal(1); // Assuming this is the first redeem request

      const redeemRecord = await tokenVault.redeemRecords(userRedeemId);
      // // // Verify details of the redeem record
      expect(redeemRecord.depositor).to.equal(user1.address);
      expect(redeemRecord.receiver).to.equal(user1.address);
      expect(redeemRecord.assets).to.equal(AMOUNT_TO_STAKE);
      expect(redeemRecord.status).to.equal(1); // Assuming 1 indicates pending
    });
  });

  describe("deposit process", function () {
    it("should update the deposit record and mint shares correctly", async function () {
      const { admin, user1, paymentToken, tokenVault, share } = await loadFixture(deployTokenVaultFixture);

      // Setup: User1 requests a deposit
      const depositAmount = AMOUNT; // 10 tokens for deposit
      await paymentToken.mint(user1.address, depositAmount);
      await paymentToken.connect(user1).approve(tokenVault.target, depositAmount);

      await tokenVault.connect(user1).requestDeposit(depositAmount, user1.address, user1.address, "0x");
      // // Pre-checks for deposit request record
      let depositRecord = await tokenVault.depositRecords(1n);
      expect(depositRecord.assets).to.equal(depositAmount);
      expect(depositRecord.status).to.equal(1n); // Status is pending

      // // Admin processes the deposit, converting assets to shares and updating the deposit record
      await paymentToken.connect(user1).approve(tokenVault.target, depositAmount);
      await expect(await tokenVault.connect(admin).deposit(1n, user1.address));
      // // Post-checks for deposit record update
      depositRecord = await tokenVault.depositRecords(1n);
      expect(depositRecord.status).to.equal(2); // Verify status is updated to complete
      // // // Verify shares were minted and sent correctly
      expect(await tokenVault.balanceOf(user1.address)).to.equal(AMOUNT);

      // Verify the deposit event emission - this step is optional and depends on whether you have an event for a successful deposit
      // await expect(...) // Add your event expectation here, similar to how you did for requestDeposit
    });
  });
  describe("redeem process", function () {
    it("should update the deposit record and mint shares correctly", async function () {
      const { user1, tokenVault, share, admin, paymentToken } = await loadFixture(deployTokenVaultFixture);
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_STAKE);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      expect(await tokenVault.connect(user1).requestRedeem(AMOUNT_TO_STAKE, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "RedeemRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, SHARES_TO_REDEEM); // Adjust args as necessary
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);

      expect(await paymentToken.balanceOf(user1.address)).to.equal("990000000"); // this test should be lower TETHER_STARTING_BALANCE

      await tokenVault.connect(admin).redeem(userRedeemId);

      expect(await paymentToken.balanceOf(user1.address)).to.equal("1000000000"); //back to starting balance
    });
  });
  describe("cancelDeposit", function () {
    it("should cancel a deposit request and refund the tokens", async function () {
      const { user1, paymentToken, tokenVault } = await loadFixture(deployTokenVaultFixture);

      // User1 requests a deposit
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");

      // Get the depositId for the created request
      const userDepositId = await tokenVault.userDepositRecord(user1.address);

      // Balance before cancellation
      const balanceBefore = await paymentToken.balanceOf(user1.address);

      expect(balanceBefore).to.equal(990000000);
      // Cancel the deposit request
      await expect(tokenVault.connect(user1).cancelDeposit(userDepositId))
        .to.emit(tokenVault, "DepositCancelled")
        .withArgs(userDepositId, user1.address);

      // Verify the deposit record status is updated to cancelled (assuming '3' is for canceled)
      const depositRecord = await tokenVault.depositRecords(userDepositId);
      expect(depositRecord.status).to.equal(3);

      // Balance after cancellation should be back to initial since tokens are refunded
      const balanceAfter = await paymentToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(1000000000);
    });
  });
  describe("cancelRedeem", function () {
    it("should allow a redeemer to cancel a redeem request and refund the shares", async function () {
      const { user1, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_STAKE);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      expect(await tokenVault.balanceOf(user1.address)).equal(10000000);
      await tokenVault.connect(user1).requestRedeem(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);
      // Before cancellation, check user1's share balance
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      // Cancel the redeem
      await expect(tokenVault.connect(user1).cancelRedeem(userRedeemId))
        .to.emit(tokenVault, "RedeemCancelled")
        .withArgs(userRedeemId, user1.address);

      // After cancellation, check user1's share balance has been refunded
      expect(await tokenVault.balanceOf(user1.address)).equal(10000000);
      // expect(finalShares).to.be.above(initialShares);
    });
  });
});
