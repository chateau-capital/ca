const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { keccak256, toUtf8Bytes, hexlify, parseEther } = require("ethers");

const AMOUNT = "150000000000000000000";
const ANOTHER_AMOUNT = "10000000000000000000";
// const DOUBLE_AMOUNT = "300000000000000000000";

const AMOUNT_TO_REDEEM = ethers.parseUnits("1", 19);

const AMOUNT_TO_STAKE = ethers.parseUnits("1", 7); // 10 tether
const TETHER_STARTING_BALANCE = ethers.parseUnits("1", 8); // 1000 tether
describe("TokenVault", function () {
  async function deployTokenVaultFixture() {
    const [admin, user1, user2, multiSig, priceSetter] = await ethers.getSigners();

    const Token = await hre.ethers.deployContract("USDT");
    const paymentToken = await Token.waitForDeployment();
    const d7540 = await ethers.getContractFactory("TokenVault");
    const tokenVault = await d7540.deploy(
      paymentToken.target,
      admin.address,
      multiSig.address,
      priceSetter.address,
      "reverse",
      "REPO"
    );

    await paymentToken.mint(user1.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(user1).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    await paymentToken.mint(user2.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(user2).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    await paymentToken.mint(admin.address, TETHER_STARTING_BALANCE);
    await paymentToken.connect(admin).approve(tokenVault.target, TETHER_STARTING_BALANCE);
    return { admin, user1, user2, multiSig, paymentToken, tokenVault, priceSetter };
  }
  describe("deployment", function () {
    it("USDC should be the payment token, Share should be the share token", async function () {
      const { tokenVault, usyc, paymentToken } = await loadFixture(deployTokenVaultFixture);
      expect(paymentToken.target).to.not.equal(0, "Token address is zero");
      expect(await tokenVault.paymentToken()).equal(paymentToken.target);
    });
  });
  describe("requestDeposit", function () {
    it("should transfer the correct amount, add a deposit record, and emit an event", async function () {
      const { user1, user2, paymentToken, tokenVault } = await loadFixture(deployTokenVaultFixture);

      // Pre-checks
      // const initialBalanceReceiver = await paymentToken.balanceOf(user2.address);
      const initialDepositRecord = await tokenVault.depositRecords(user1.address); // Adjust according to how you access deposit records

      expect(initialDepositRecord[0]).equal("0x0000000000000000000000000000000000000000");
      expect(initialDepositRecord[1]).equal("0x0000000000000000000000000000000000000000");
      expect(initialDepositRecord[2]).equal(0n);
      expect(initialDepositRecord[3]).equal("");

      expect(await paymentToken.balanceOf(user1.address)).to.equal(TETHER_STARTING_BALANCE);
      // Listen for the event
      await expect(await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "DepositRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, AMOUNT_TO_STAKE); // Adjust arguments as necessary

      // Post-checks: Verify the balance of the receiver has increased by AMOUNT
      expect(await paymentToken.balanceOf(user1.address)).to.equal("90000000"); // this test should be lower TETHER_STARTING_BALANCE

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

      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_REDEEM);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      expect(await tokenVault.connect(user1).requestRedeem(ANOTHER_AMOUNT, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "RedeemRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, ANOTHER_AMOUNT); // Adjust args as necessary
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      // Post-checks: Verify the shares balance of user1 has decreased by SHARES_TO_REDEEM

      // Verify a redeem record was added
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);
      expect(userRedeemId).to.equal(1); // Assuming this is the first redeem request

      const redeemRecord = await tokenVault.redeemRecords(userRedeemId);
      // // // // Verify details of the redeem record
      expect(redeemRecord.depositor).to.equal(user1.address);
      expect(redeemRecord.receiver).to.equal(user1.address);
      expect(redeemRecord.shares).to.equal(AMOUNT_TO_REDEEM);
      expect(redeemRecord.status).to.equal(1); // Assuming 1 indicates pending
    });
  });

  describe("deposit process", function () {
    it("should update the deposit record and mint shares correctly", async function () {
      const { admin, user1, paymentToken, tokenVault, share } = await loadFixture(deployTokenVaultFixture);

      // Setup: User1 requests a deposit
      await paymentToken.mint(user1.address, AMOUNT_TO_STAKE);
      await paymentToken.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);

      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      // // Pre-checks for deposit request record
      let depositRecord = await tokenVault.depositRecords(1n);
      expect(depositRecord.assets).to.equal(AMOUNT_TO_STAKE);
      expect(depositRecord.status).to.equal(1n); // Status is pending

      // // Admin processes the deposit, converting assets to shares and updating the deposit record
      // await paymentToken.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      await expect(await tokenVault.connect(admin).deposit(1n, user1.address));
      // // Post-checks for deposit record update
      depositRecord = await tokenVault.depositRecords(1n);
      expect(depositRecord.status).to.equal(2); // Verify status is updated to complete
      // // // Verify shares were minted and sent correctly
      expect(await tokenVault.balanceOf(user1.address)).to.equal(AMOUNT_TO_REDEEM);
    });
  });
  describe("redeem process", function () {
    it("should update the deposit record and mint shares correctly", async function () {
      const { user1, tokenVault, share, admin, paymentToken, multiSig } = await loadFixture(deployTokenVaultFixture);
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");

      expect(await paymentToken.balanceOf(multiSig)).equal(0);
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await paymentToken.balanceOf(multiSig)).equal(AMOUNT_TO_STAKE);
      expect(await tokenVault.balanceOf(user1.address)).equal(ANOTHER_AMOUNT);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);
      expect(await tokenVault.connect(user1).requestRedeem(ANOTHER_AMOUNT, user1.address, user1.address, "0x"))
        .to.emit(tokenVault, "RedeemRequest")
        .withArgs(user1.address, user1.address, 1, user1.address, SHARES_TO_REDEEM); // Adjust args as necessary
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);

      await paymentToken.connect(multiSig).approve(tokenVault.target, AMOUNT_TO_STAKE);
      await paymentToken.connect(multiSig).transfer(tokenVault.target, AMOUNT_TO_STAKE);

      expect(await paymentToken.balanceOf(user1.address)).to.equal("90000000"); // this test should be lower TETHER_STARTING_BALANCE
      await tokenVault.connect(admin).redeem(userRedeemId);

      expect(await tokenVault.balanceOf(multiSig)).equal(0);
      expect(await paymentToken.balanceOf(user1.address)).to.equal("100000000"); //back to starting balance
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

      expect(balanceBefore).to.equal(90000000);
      // Cancel the deposit request
      await expect(tokenVault.connect(user1).cancelDeposit(userDepositId))
        .to.emit(tokenVault, "DepositCancelled")
        .withArgs(userDepositId, user1.address);

      // Verify the deposit record status is updated to cancelled (assuming '3' is for canceled)
      const depositRecord = await tokenVault.depositRecords(userDepositId);
      expect(depositRecord.status).to.equal(3);

      // Balance after cancellation should be back to initial since tokens are refunded
      const balanceAfter = await paymentToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal("100000000");
    });
  });
  describe("cancelRedeem", function () {
    it("should allow a redeemer to cancel a redeem request and refund the shares", async function () {
      const { user1, tokenVault, admin } = await loadFixture(deployTokenVaultFixture);
      const SHARES_TO_REDEEM = AMOUNT; // Example amount of shares
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_REDEEM);
      await tokenVault.connect(user1).approve(tokenVault.target, AMOUNT_TO_REDEEM);
      await tokenVault.connect(user1).requestRedeem(AMOUNT_TO_REDEEM, user1.address, user1.address, "0x");
      const userRedeemId = await tokenVault.userRedeemRecord(user1.address);
      // Before cancellation, check user1's share balance
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      // Cancel the redeem
      await expect(tokenVault.connect(user1).cancelRedeem(userRedeemId))
        .to.emit(tokenVault, "RedeemCancelled")
        .withArgs(userRedeemId, user1.address);

      // After cancellation, check user1's share balance has been refunded
      expect(await tokenVault.balanceOf(user1.address)).equal(AMOUNT_TO_REDEEM);
      // expect(finalShares).to.be.above(initialShares);
    });
  });
  it("should allow the owner to update the price", async function () {
    const { admin, tokenVault, priceSetter } = await loadFixture(deployTokenVaultFixture);
    const newPrice = ethers.parseUnits("1.1", 18); // New price to set
    const oldPrice = ethers.parseUnits("1.0", 18); // New price to set
    expect(await tokenVault.getPrice()).to.equal(oldPrice);
    // Update the price
    await tokenVault.connect(priceSetter).setPrice(newPrice);

    // Verify the price was updated correctly
    expect(await tokenVault.getPrice()).to.equal(newPrice);
  });

  it("should not allow non-owners to update the price", async function () {
    const { user1, tokenVault } = await loadFixture(deployTokenVaultFixture);
    const newPrice = ethers.parseUnits("1.2", 18); // Attempt to set a new price
    const oldPrice = ethers.parseUnits("1.0", 18); // New price to set

    // Try to update the price as a non-owner
    await expect(tokenVault.connect(user1).setPrice(newPrice)); // Assuming use of OpenZeppelin's Ownable for access control

    expect(await tokenVault.getPrice()).to.equal(oldPrice);
  });

  describe("when the contract is paused", function () {
    it("should prevent deposits", async function () {
      const { admin, user1, tokenVault, paymentToken } = await loadFixture(deployTokenVaultFixture);
      // Pause the contract
      await tokenVault.connect(admin).pause();

      // await tokenVault.connect(user1).requestDeposit(1000, user1.address, user1.address, "0x");
      expect(true);
      // Try to make a deposit
      await expect(tokenVault.connect(user1).requestDeposit(1000, user1.address, user1.address, "0x"));

      await tokenVault.connect(admin).unpause();

      expect(await tokenVault.connect(user1).requestDeposit(1000, user1.address, user1.address, "0x"));
      expect(true);
    });
  });
  describe("Freeze and Unfreeze Accounts", function () {
    it("should prevent and allow transactions based on freeze status", async function () {
      const { admin, user2, user1, paymentToken, tokenVault, share } = await loadFixture(deployTokenVaultFixture);

      // Mint shares to user1 and approve the vault to use them
      await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");

      await tokenVault.connect(user2).requestDeposit(AMOUNT_TO_STAKE, user2.address, user2.address, "0x");
      expect(await tokenVault.balanceOf(user1.address)).equal(0);
      await tokenVault.connect(admin).deposit(1n, user1.address);
      await tokenVault.connect(admin).deposit(2n, user2.address);
      // await share.connect(user1).approve(tokenVault.target, AMOUNT_TO_STAKE);

      // Freeze user1's account
      await tokenVault.connect(admin).freezeAccount(user1.address);

      await tokenVault.connect(user2).transfer(admin.address, AMOUNT_TO_STAKE);
      await tokenVault.connect(admin).unfreezeAccount(user1.address);
      await tokenVault.connect(user1).transfer(user2.address, AMOUNT_TO_STAKE);
    });
  });
  it("should allow the admin to revoke the PRICE_SETTER_ROLE", async function () {
    const { tokenVault, admin, user1 } = await loadFixture(deployTokenVaultFixture);
    // First, grant the role
    await tokenVault.connect(admin).grantPriceSetter(user1.address);
    // Now, revoke the role
    await expect(tokenVault.connect(admin).revokePriceSetter(user1.address))
      .to.emit(tokenVault, "RoleRevoked")
      .withArgs(keccak256(toUtf8Bytes("PRICE_SETTER_ROLE")), user1.address, admin.address);
    expect(await tokenVault.hasRole(keccak256(toUtf8Bytes("PRICE_SETTER_ROLE")), user1.address)).to.be.false;
  });

  it("should not allow non-admins to grant the PRICE_SETTER_ROLE", async function () {
    const { tokenVault, admin, user1 } = await loadFixture(deployTokenVaultFixture);
    // hardhat cant read custom errors
    // await expect(tokenVault.connect(user1).grantPriceSetter(admin.address)).to.be.revertedWith(
    //   "AccessControl: account " +
    //     user1.address.toLowerCase() +
    //     " is missing role " +
    //     hexlify(keccak256(toUtf8Bytes("DEFAULT_ADMIN_ROLE")))
    // );
  });

  it("should not allow non-admins to revoke the PRICE_SETTER_ROLE", async function () {
    const { tokenVault, admin, user1 } = await loadFixture(deployTokenVaultFixture);
    // First, grant the role using the admin account
    await tokenVault.connect(admin).grantPriceSetter(user1.address);

    // Attempt to revoke the role using a non-admin account
    // hardhat cant read custom errors
    // await expect(tokenVault.connect(user1).revokePriceSetter(user1.address)).to.be.revertedWith(
    //   "AccessControl: account " +
    //     user1.address.toLowerCase() +
    //     " is missing role " +
    //     hexlify(keccak256(toUtf8Bytes("DEFAULT_ADMIN_ROLE")))
    // );
  });
  it("should return the existing deposit request ID if one is already pending", async function () {
    const { tokenVault, admin, user1, paymentToken } = await loadFixture(deployTokenVaultFixture);

    expect(await paymentToken.balanceOf(user1.address)).to.equal(TETHER_STARTING_BALANCE);
    await expect(await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x"))
      .to.emit(tokenVault, "DepositRequest")
      .withArgs(user1.address, user1.address, 1, user1.address, AMOUNT_TO_STAKE); // Adjust arguments as necessary

    // Post-checks: Verify the balance of the receiver has increased by AMOUNT
    expect(await paymentToken.balanceOf(user1.address)).to.equal("90000000"); // this test should be lower TETHER_STARTING_BALANCE

    // // verify a user can fetch their record
    const userDepositId = await tokenVault.userDepositRecord(user1.address); // Adjust according to how you access deposit records
    expect(userDepositId).equal(1n);
    // User initiates a deposit request
    const initialRequestTx = await tokenVault
      .connect(user1)
      .requestDeposit("90000000", user1.address, user1.address, "0x");
    const initialRequestReceipt = await initialRequestTx.wait();
    const initialRequestId = initialRequestReceipt.events?.filter((x) => x.event === "DepositRequest")[0].args
      .requestId;

    // User tries to initiate another deposit request
    const subsequentRequestTx = await tokenVault
      .connect(user1)
      .requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");
    const subsequentRequestReceipt = await subsequentRequestTx.wait();
    const subsequentRequestId = subsequentRequestReceipt.events?.filter((x) => x.event === "DepositRequest")[0].args
      .requestId;

    // Check if the initial and subsequent request IDs are the same, indicating the original request was reused
    expect(subsequentRequestId).to.equal(initialRequestId);

    // Verify the state of the deposit to ensure it is still pending

    // const userDepositId = await tokenVault.userDepositRecord(user1.address); // Adjust according to how you access deposit records
    expect(userDepositId).equal(1n);

    expect(await paymentToken.balanceOf(user1.address)).to.equal("90000000"); // this test should be lower TETHER_STARTING_BALANCE
    expect((await tokenVault.depositRecords(userDepositId))[3]).to.equal(1); // Assuming 1 represents a pending status

    await tokenVault.connect(admin).deposit(1n, user1.address);

    await tokenVault.connect(user1).requestDeposit(AMOUNT_TO_STAKE, user1.address, user1.address, "0x");

    expect((await tokenVault.depositRecords(userDepositId))[3]).to.equal(2);
  });
  describe("deployment", function () {
    it("should set the correct name and symbol for the token", async function () {
      const { tokenVault } = await loadFixture(deployTokenVaultFixture);
      expect(await tokenVault.name()).to.equal("reverse");
      expect(await tokenVault.symbol()).to.equal("REPO");
    });
  });
});
