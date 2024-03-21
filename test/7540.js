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
    console.log(paymentToken.target);

    console.log("here");
    const Share = await ethers.getContractFactory("Share");
    const share = await Share.deploy("Share", "SHARE");
    const d7540 = await ethers.getContractFactory("Vault");
    const Usyc = await hre.ethers.deployContract("USYC");
    const usyc = await Usyc.waitForDeployment();
    console.log("here");
    console.log(share.target, paymentToken.target, admin.address);
    const tokenVault = await d7540.deploy(share.target, paymentToken.target, admin.address);

    // Deploy your TokenVault here, passing the token address
    // const TokenVault = await ethers.getContractFactory("USYCTokenVault");
    // const tokenVault = await TokenVault.deploy(i7540.target, token.target, admin, "Share", "777");
    // await tokenVault.waitForDeployment();

    // Initial token distribution
    // await token.mint(user1.address, AMOUNT);
    // await token.mint(user2.address, AMOUNT);
    console.log(admin.address, user1.address);

    return { admin, user1, user2, paymentToken, tokenVault, usyc, share };
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

      // Setup: Mint and approve tokens for user1
      await paymentToken.mint(user1.address, TETHER_STARTING_BALANCE);
      await paymentToken.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);

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
      const { user1, paymentToken, tokenVault, share } = await loadFixture(deployTokenVaultFixture);

      // Setup: Assume user1 has shares to redeem.
      // This requires user1 to have a balance of the share token.
      // For simplicity, let's assume shares are minted directly for the purpose of this test.
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares
      await share.mint([user1.address], [SHARES_TO_REDEEM]);
      await share.connect(user1).approve(tokenVault.target, SHARES_TO_REDEEM);

      // Pre-checks

      const initialSharesBalance = await share.balanceOf(user1.address);
      expect(initialSharesBalance).to.equal(SHARES_TO_REDEEM);

      // Execute requestRedeem
      await expect(tokenVault.connect(user1).requestRedeem(SHARES_TO_REDEEM, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "RedeemRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, SHARES_TO_REDEEM); // Adjust args as necessary

      // // Post-checks: Verify the shares balance of user1 has decreased by SHARES_TO_REDEEM
      // const expectedBalanceAfterRedeem = initialSharesBalance.sub(SHARES_TO_REDEEM);
      // expect(await share.balanceOf(user1.address)).to.equal(expectedBalanceAfterRedeem);

      // // Verify a redeem record was added
      // const userRedeemId = await tokenVault.userRedeemRecord(user1.address);
      // expect(userRedeemId).to.equal(1); // Assuming this is the first redeem request

      // const redeemRecord = await tokenVault.redeemRecords(userRedeemId);
      // // Verify details of the redeem record
      // expect(redeemRecord.depositor).to.equal(user1.address);
      // expect(redeemRecord.receiver).to.equal(user1.address);
      // expect(redeemRecord.assets).to.equal(SHARES_TO_REDEEM);
      // expect(redeemRecord.status).to.equal(1); // Assuming 1 indicates pending
    });
  });

  //   describe("preDeposit", function () {
  //     it("should allow users to pre-deposit tokens", async function () {
  //       const { user1, user2, token, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
  //       console.log(await tokenVault.paymentToken());
  //       console.log(token.target);
  //       // await token.connect(user1).approve(tokenVault.target, AMOUNT);
  //       await token.connect(user1).approve(tokenVault.target, AMOUNT);
  //       expect(await token.balanceOf(user1)).to.equal(AMOUNT);
  //       await tokenVault.connect(user1).preDeposit(AMOUNT);
  //       expect(await tokenVault.depositAmount(user1.address)).to.equal(AMOUNT);
  //       expect(await token.balanceOf(user1)).to.equal("0");
  //       expect(await token.balanceOf(tokenVault.target)).to.equal(AMOUNT);
  //       // user 2 flow
  //       await token.connect(user2).approve(tokenVault.target, AMOUNT);
  //       expect(await token.balanceOf(user2)).to.equal(AMOUNT);
  //       await tokenVault.connect(user2).preDeposit(AMOUNT);
  //       expect(await tokenVault.depositAmount(user2.address)).to.equal(AMOUNT);
  //       expect(await token.balanceOf(user2)).to.equal("0");
  //       expect(await token.balanceOf(tokenVault.target)).to.equal(DOUBLE_AMOUNT);
  //     });
  //   });
  //   describe("USYCTokenVault deposit process", function () {
  //     it("should correctly set pendingDeposits and depositConfirmed mappings after a deposit", async function () {
  //       const { user2, user1, token, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
  //       // User1 approves tokenVault to spend their tokens and makes a pre-deposit
  //       const depositAmount = AMOUNT;
  //       await token.connect(user1).approve(tokenVault.target, depositAmount);
  //       await tokenVault.connect(user1).preDeposit(depositAmount);
  //       await token.connect(user2).approve(tokenVault.target, depositAmount);
  //       await tokenVault.connect(user2).preDeposit(depositAmount);
  //       //preDeposit
  //       expect(await tokenVault.depositAmount(user1.address)).equal(depositAmount);
  //       expect(await tokenVault.status(user1.address)).equal("DepositPending");
  //       expect(await tokenVault.depositAmount(user1.address)).equal(AMOUNT);
  //       expect(await tokenVault.pendingDepositAddresses(0)).equal(user1.address);
  //       expect(await tokenVault.depositAmount(user2.address)).equal(depositAmount);
  //       expect(await tokenVault.status(user2.address)).equal("DepositPending");
  //       expect(await tokenVault.depositAmount(user2.address)).equal(AMOUNT);
  //       expect(await tokenVault.pendingDepositAddresses(1)).equal(user2.address);
  //       // executeDeposit
  //       await tokenVault.connect(admin).executeDeposit();
  //       expect(await tokenVault.status(user1.address)).equal("DepositConfirmed");
  //       expect(await tokenVault.depositAmount(user1.address)).equal(0);
  //       expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT);
  //       expect(await tokenVault.depositAmount(user2.address)).equal(0);
  //       expect(await tokenVault.status(user2.address)).equal("DepositConfirmed");
  //       expect(await tokenVault.balanceOf(user2.address)).equal(AMOUNT);
  //       // preWithdraw
  //       await tokenVault.connect(user1).preWithdraw(AMOUNT);
  //       expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(AMOUNT);
  //       expect(await tokenVault.balanceOf(user1.address)).equal(0);
  //       expect(await tokenVault.pendingWithdrawAddresses(0)).equal(user1.address);
  //       await tokenVault.connect(user2).preWithdraw(5);
  //       expect(await tokenVault.shareAmountToRedeem(user2.address)).equal(5);
  //       expect(await tokenVault.balanceOf(user2.address)).equal("149999999999999999995");
  //       expect(await tokenVault.pendingWithdrawAddresses(0)).equal(user1.address);
  //       await tokenVault.connect(user2).preWithdraw(100000);
  //       expect(await tokenVault.shareAmountToRedeem(user2.address)).equal(100005);
  //       expect(await tokenVault.balanceOf(user2.address)).equal("149999999999999899995");
  //       expect(await tokenVault.pendingWithdrawAddresses(1)).equal(user2.address);
  //       // executeWithdraw
  //       expect(await token.balanceOf(user1)).to.equal(0);
  //       await tokenVault.connect(admin).executeWithdraw();
  //       expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(0);
  //       expect(await tokenVault.status(user1.address)).equal("WithdrawConfirmed");
  //       expect(await token.balanceOf(user1)).to.equal(AMOUNT);
  //       let shareAmountToRedeem = await tokenVault.shareAmountToRedeem(user1.address);
  //       let status = await tokenVault.status(user1.address);
  //       let paymentToken = await token.balanceOf(user1.address);
  //       let shares = await tokenVault.balanceOf(user1.address);
  //       console.log({ shareAmountToRedeem, status, paymentToken, shares });
  //       // whole flow
  //       await token.connect(user1).approve(tokenVault.target, depositAmount);
  //       await tokenVault.connect(user1).preDeposit(5);
  //       expect(await tokenVault.depositAmount(user1.address)).equal(5);
  //       await tokenVault.connect(admin).executeDeposit();
  //       await tokenVault.connect(user1).preWithdraw(3);
  //       expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(3);
  //       await tokenVault.connect(user1).preWithdraw(2);
  //       expect(await tokenVault.shareAmountToRedeem(user1.address)).equal(5);
  //       await tokenVault.connect(admin).executeWithdraw();
  //       shareAmountToRedeem = await tokenVault.shareAmountToRedeem(user1.address);
  //       status = await tokenVault.status(user1.address);
  //       paymentToken = await token.balanceOf(user1.address);
  //       shares = await tokenVault.balanceOf(user1.address);
  //       console.log({ shareAmountToRedeem, status, paymentToken, shares });
  //     });
  //   });

  // Additional tests can include various scenarios, such as attempting to deposit more than the allowance,
  // trying to confirm deposit for addresses with no pending deposits, and so on.
});
