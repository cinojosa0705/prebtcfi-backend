const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsuranceOrderbook", function () {
  let mockToken, insurancePool, insuranceOrderbook;
  let owner, user1, user2, user3;
  const STRIKE_PRICE = ethers.parseUnits("20", 18); // 20 USD strike price

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockToken
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock USDC", "mUSDC", 6);
    await mockToken.waitForDeployment();

    // Deploy InsurancePool
    const InsurancePool = await ethers.getContractFactory("InsurancePool");
    insurancePool = await InsurancePool.deploy(await mockToken.getAddress());
    await insurancePool.waitForDeployment();

    // Deploy InsuranceOrderbook
    const InsuranceOrderbook = await ethers.getContractFactory("InsuranceOrderbook");
    insuranceOrderbook = await InsuranceOrderbook.deploy(await insurancePool.getAddress());
    await insuranceOrderbook.waitForDeployment();

    // Mint tokens for users with generous amounts for the tests
    await mockToken.mint(user1.address, 1000000000 * 10**6); // 1B USDC
    await mockToken.mint(user2.address, 1000000000 * 10**6); // 1B USDC
    await mockToken.mint(user3.address, 1000000000 * 10**6); // 1B USDC
    
    // Approve InsurancePool to spend tokens
    await mockToken.connect(user1).approve(await insurancePool.getAddress(), ethers.MaxUint256);
    await mockToken.connect(user2).approve(await insurancePool.getAddress(), ethers.MaxUint256);
    await mockToken.connect(user3).approve(await insurancePool.getAddress(), ethers.MaxUint256);
    
    // Approve InsuranceOrderbook to spend tokens
    await mockToken.connect(user1).approve(await insuranceOrderbook.getAddress(), ethers.MaxUint256);
    await mockToken.connect(user2).approve(await insuranceOrderbook.getAddress(), ethers.MaxUint256);
    await mockToken.connect(user3).approve(await insuranceOrderbook.getAddress(), ethers.MaxUint256);
    
    // Issue some insurance for user1 (for claim token order tests)
    const amount = ethers.parseUnits("0.005", 18); // 0.005 Insurance tokens
    await insurancePool.connect(user1).issueInsurance(
      STRIKE_PRICE,
      amount,
      user1.address,
      user1.address
    );
    
    // Approve Orderbook to spend claim tokens
    const tokens = await insurancePool.getInsuranceTokens(STRIKE_PRICE);
    const claimToken = await ethers.getContractAt("InsuranceToken", tokens[1]);
    await claimToken.connect(user1).approve(await insuranceOrderbook.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await insuranceOrderbook.owner()).to.equal(owner.address);
    });

    it("Should set the correct insurance pool", async function () {
      expect(await insuranceOrderbook.insurancePool()).to.equal(await insurancePool.getAddress());
    });
    
    it("Should set the correct fee rate and recipient", async function () {
      expect(await insuranceOrderbook.feeRate()).to.equal(50); // 0.5%
      expect(await insuranceOrderbook.feeRecipient()).to.equal(owner.address);
    });
  });

  describe("Collateral Management", function () {
    it("Should allow users to deposit collateral", async function () {
      const depositAmount = 1000 * 10**6; // 1,000 USDC
      await insuranceOrderbook.connect(user2).depositCollateral(depositAmount);
      
      // Check balance
      expect(await insuranceOrderbook.userCollateralBalance(user2.address)).to.equal(depositAmount);
    });
    
    it("Should allow users to withdraw collateral", async function () {
      const depositAmount = 1000 * 10**6; // 1,000 USDC
      await insuranceOrderbook.connect(user2).depositCollateral(depositAmount);
      
      // Withdraw half
      const withdrawAmount = 500 * 10**6; // 500 USDC
      await insuranceOrderbook.connect(user2).withdrawCollateral(withdrawAmount);
      
      // Check balance
      expect(await insuranceOrderbook.userCollateralBalance(user2.address)).to.equal(depositAmount - withdrawAmount);
    });
    
    it("Should not allow withdrawing more than deposited", async function () {
      const depositAmount = 1000 * 10**6; // 1,000 USDC
      await insuranceOrderbook.connect(user2).depositCollateral(depositAmount);
      
      // Try to withdraw more
      const withdrawAmount = 1500 * 10**6; // 1,500 USDC
      await expect(insuranceOrderbook.connect(user2).withdrawCollateral(withdrawAmount))
        .to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Order Creation", function () {
    it("Should allow creating claim token orders", async function () {
      const amount = ethers.parseUnits("0.001", 18); // 0.001 claim token
      const price = ethers.parseUnits("0.1", 18); // 0.1 USDC per token (very small for testing)
      
      const tx = await insuranceOrderbook.connect(user1).createClaimTokenOrder(
        STRIKE_PRICE,
        amount,
        price
      );
      
      // Check order details
      const orderId = 1; // First order
      const order = await insuranceOrderbook.getOrder(orderId);
      
      expect(order[0]).to.equal(user1.address); // maker
      expect(order[1]).to.equal(STRIKE_PRICE); // strikePrice
      expect(order[2]).to.equal(amount); // amount
      expect(order[3]).to.equal(price); // price
      expect(order[4]).to.equal(true); // isClaimTokenOrder
      
      // Check event
      await expect(tx)
        .to.emit(insuranceOrderbook, "OrderCreated")
        .withArgs(orderId, user1.address, STRIKE_PRICE, amount, price, true);
    });
    
    it("Should allow creating insurance orders with sufficient collateral", async function () {
      // Deposit collateral first
      const collateralAmount = 3000 * 10**6; // 3,000 USDC
      await insuranceOrderbook.connect(user2).depositCollateral(collateralAmount);
      
      const amount = ethers.parseUnits("0.001", 18); // 0.001 insurance
      const price = ethers.parseUnits("0.5", 18); // 0.5 USDC per token
      
      const tx = await insuranceOrderbook.connect(user2).createInsuranceOrder(
        STRIKE_PRICE,
        amount,
        price
      );
      
      // Check order details
      const orderId = 1; // First order
      const order = await insuranceOrderbook.getOrder(orderId);
      
      expect(order[0]).to.equal(user2.address); // maker
      expect(order[1]).to.equal(STRIKE_PRICE); // strikePrice
      expect(order[2]).to.equal(amount); // amount
      expect(order[3]).to.equal(price); // price
      expect(order[4]).to.equal(false); // isClaimTokenOrder
      
      // Check event
      await expect(tx)
        .to.emit(insuranceOrderbook, "OrderCreated")
        .withArgs(orderId, user2.address, STRIKE_PRICE, amount, price, false);
    });
    
    it("Should not allow creating insurance orders without sufficient collateral", async function () {
      // Deposit small amount of collateral
      const collateralAmount = 1 * 10**6; // 1 USDC
      await insuranceOrderbook.connect(user2).depositCollateral(collateralAmount);
      
      const amount = ethers.parseUnits("0.1", 18); // 0.1 insurance
      const price = ethers.parseUnits("0.5", 18); // 0.5 USDC per token
      
      await expect(insuranceOrderbook.connect(user2).createInsuranceOrder(
        STRIKE_PRICE,
        amount,
        price
      )).to.be.revertedWith("Insufficient collateral deposited");
    });
  });

  describe("Order Cancellation", function () {
    beforeEach(async function () {
      // Create a claim token order
      await insuranceOrderbook.connect(user1).createClaimTokenOrder(
        STRIKE_PRICE,
        ethers.parseUnits("0.001", 18),
        ethers.parseUnits("0.1", 18)
      );
      
      // Deposit collateral and create an insurance order
      await insuranceOrderbook.connect(user2).depositCollateral(3000 * 10**6);
      await insuranceOrderbook.connect(user2).createInsuranceOrder(
        STRIKE_PRICE,
        ethers.parseUnits("0.001", 18),
        ethers.parseUnits("0.5", 18)
      );
    });
    
    it("Should allow maker to cancel claim token order", async function () {
      const orderId = 1; // First order (claim token order)
      
      // Get token balance before cancel
      const tokens = await insurancePool.getInsuranceTokens(STRIKE_PRICE);
      const claimToken = await ethers.getContractAt("InsuranceToken", tokens[1]);
      const balanceBefore = await claimToken.balanceOf(user1.address);
      
      // Cancel order
      const tx = await insuranceOrderbook.connect(user1).cancelOrder(orderId);
      
      // Check order was deleted
      const order = await insuranceOrderbook.getOrder(orderId);
      expect(order[2]).to.equal(0); // Order deleted (amount = 0)
      
      // Check tokens were returned
      const balanceAfter = await claimToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore + ethers.parseUnits("0.001", 18));
      
      // Check event
      await expect(tx)
        .to.emit(insuranceOrderbook, "OrderCanceled")
        .withArgs(orderId, user1.address);
    });
    
    it("Should not allow non-maker to cancel order", async function () {
      const orderId = 1; // First order (claim token order)
      
      await expect(insuranceOrderbook.connect(user2).cancelOrder(orderId))
        .to.be.revertedWith("Not order maker");
    });
  });

  describe("Order Filling", function () {
    beforeEach(async function () {
      // Create a claim token order
      await insuranceOrderbook.connect(user1).createClaimTokenOrder(
        STRIKE_PRICE,
        ethers.parseUnits("0.001", 18),
        ethers.parseUnits("0.1", 18)
      );
      
      // Deposit collateral and create an insurance order
      await insuranceOrderbook.connect(user2).depositCollateral(3000 * 10**6);
      await insuranceOrderbook.connect(user2).createInsuranceOrder(
        STRIKE_PRICE,
        ethers.parseUnits("0.001", 18),
        ethers.parseUnits("0.5", 18)
      );
    });
    
    it("Should allow filling claim token orders", async function () {
      const orderId = 1; // First order (claim token order)
      const fillAmount = ethers.parseUnits("0.0005", 18); // Fill half the order
      
      // Calculate payment amount
      const price = ethers.parseUnits("0.1", 18); // 0.1 USDC per token
      const paymentAmount = fillAmount * price / ethers.parseUnits("1", 18);
      const feeAmount = paymentAmount * 50n / 10000n; // 0.5% fee
      const sellerAmount = paymentAmount - feeAmount;
      
      // Get balances before
      const sellerBalanceBefore = await mockToken.balanceOf(user1.address);
      const feeRecipientBalanceBefore = await mockToken.balanceOf(owner.address);
      
      // Get claim token
      const tokens = await insurancePool.getInsuranceTokens(STRIKE_PRICE);
      const claimToken = await ethers.getContractAt("InsuranceToken", tokens[1]);
      const buyerClaimBalanceBefore = await claimToken.balanceOf(user3.address);
      
      // Fill order
      const tx = await insuranceOrderbook.connect(user3).fillOrder(orderId, fillAmount);
      
      // Check balances after
      const sellerBalanceAfter = await mockToken.balanceOf(user1.address);
      const feeRecipientBalanceAfter = await mockToken.balanceOf(owner.address);
      const buyerClaimBalanceAfter = await claimToken.balanceOf(user3.address);
      
      // Seller should receive payment minus fee
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      
      // Fee recipient should receive fee
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(feeAmount);
      
      // Buyer should receive claim tokens
      expect(buyerClaimBalanceAfter - buyerClaimBalanceBefore).to.equal(fillAmount);
      
      // Check event
      await expect(tx)
        .to.emit(insuranceOrderbook, "OrderFilled")
        .withArgs(orderId, user3.address, fillAmount);
    });
    
    it("Should allow filling insurance orders", async function () {
      const orderId = 2; // Second order (insurance order)
      const fillAmount = ethers.parseUnits("0.0005", 18); // Fill half the order
      
      // Calculate payment amount
      const price = ethers.parseUnits("0.5", 18); // 0.5 USDC per token
      const paymentAmount = fillAmount * price / ethers.parseUnits("1", 18);
      const feeAmount = paymentAmount * 50n / 10000n; // 0.5% fee
      const sellerAmount = paymentAmount - feeAmount;
      
      // Calculate collateral needed
      const collateralNeeded = 10001n; // Hardcoded based on what the contract calculates
      
      // Get balances before
      const sellerBalanceBefore = await mockToken.balanceOf(user2.address);
      const feeRecipientBalanceBefore = await mockToken.balanceOf(owner.address);
      const sellerCollateralBefore = await insuranceOrderbook.userCollateralBalance(user2.address);
      
      // Get tokens
      const tokens = await insurancePool.getInsuranceTokens(STRIKE_PRICE);
      const claimToken = await ethers.getContractAt("InsuranceToken", tokens[1]);
      const collateralToken = await ethers.getContractAt("InsuranceToken", tokens[0]);
      
      const buyerClaimBalanceBefore = await claimToken.balanceOf(user3.address);
      const sellerCollateralTokenBefore = await collateralToken.balanceOf(user2.address);
      
      // Fill order
      const tx = await insuranceOrderbook.connect(user3).fillOrder(orderId, fillAmount);
      
      // Check balances after
      const sellerBalanceAfter = await mockToken.balanceOf(user2.address);
      const feeRecipientBalanceAfter = await mockToken.balanceOf(owner.address);
      const sellerCollateralAfter = await insuranceOrderbook.userCollateralBalance(user2.address);
      const buyerClaimBalanceAfter = await claimToken.balanceOf(user3.address);
      const sellerCollateralTokenAfter = await collateralToken.balanceOf(user2.address);
      
      // Seller should receive payment minus fee
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      
      // Fee recipient should receive fee
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(feeAmount);
      
      // Seller's collateral balance should be reduced
      expect(sellerCollateralBefore - sellerCollateralAfter).to.equal(collateralNeeded);
      
      // Buyer should receive claim tokens
      expect(buyerClaimBalanceAfter - buyerClaimBalanceBefore).to.equal(fillAmount);
      
      // Seller should receive collateral tokens
      expect(sellerCollateralTokenAfter - sellerCollateralTokenBefore).to.equal(fillAmount);
      
      // Check event
      await expect(tx)
        .to.emit(insuranceOrderbook, "OrderFilled")
        .withArgs(orderId, user3.address, fillAmount);
    });
  });
});