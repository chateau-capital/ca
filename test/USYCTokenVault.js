const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const AMOUNT = "150000000000000000000";
describe("TokenVault", function () {
  // Common setup for all tests
  async function deployTokenVaultFixture() {
    const [admin, user1, user2] = await ethers.getSigners();

    // Deploy your ERC20 token here
    const Token = await hre.ethers.deployContract("USDT");
    const token = await Token.waitForDeployment();

    // Deploy your TokenVault here, passing the token address
    const TokenVault = await ethers.getContractFactory("USYCTokenVault");
    const tokenVault = await TokenVault.deploy(token.target, "Share", "777");
    await tokenVault.waitForDeployment();

    // Initial token distribution
    await token.mint(user1.address, AMOUNT);
    await token.mint(user2.address, AMOUNT);

    return { admin, user1, user2, token, tokenVault };
  }

  describe("preDeposit", function () {
    it("should allow users to pre-deposit tokens", async function () {
      const { user1, token, tokenVault } = await loadFixture(deployTokenVaultFixture);
      // // Approve and preDeposit
      await token.connect(user1).approve(tokenVault.target, AMOUNT);
      expect(await token.balanceOf(user1)).to.equal(AMOUNT);
      await tokenVault.connect(user1).preDeposit(AMOUNT);
      // // Verify deposit is pending
      expect(await tokenVault.pendingDeposits(user1.address)).to.equal(AMOUNT);
      expect(await token.balanceOf(user1)).to.equal("0");
    });
  });

  // describe("adminConfirmDeposit", function () {
  //   it("should allow admin to confirm deposits and distribute shares", async function () {
  //     const { admin, user1, token, tokenVault } = await loadFixture(deployTokenVaultFixture);

  //     // Pre-deposit setup
  //     const depositAmount = ethers.utils.parseUnits("100", 18);
  //     await token.connect(user1).approve(tokenVault.address, depositAmount);
  //     await tokenVault.connect(user1).preDeposit(depositAmount);

  //     // Confirm deposit
  //     await tokenVault.connect(admin).adminConfirmDeposit([user1.address]);

  //     // Verify shares distribution
  //     const shares = await tokenVault.balanceOf(user1.address);
  //     expect(shares).to.be.gt(0); // Assumes _convertToShares logic issues shares > 0 for the deposit
  //     expect(await tokenVault.pendingDeposits(user1.address)).to.equal(0);
  //     expect(await tokenVault.depositConfirmed(user1.address)).to.equal(true);
  //   });

  //   it("should not allow non-admin to confirm deposits", async function () {
  //     const { user1, user2, token, tokenVault } = await loadFixture(deployTokenVaultFixture);

  //     // Attempt by non-admin to confirm deposit
  //     await expect(tokenVault.connect(user2).adminConfirmDeposit([user1.address])).to.be.revertedWith("Not admin"); // Assumes your contract uses this revert message for non-admin actions
  //   });
  // });

  // Additional tests can include various scenarios, such as attempting to deposit more than the allowance,
  // trying to confirm deposit for addresses with no pending deposits, and so on.
});
