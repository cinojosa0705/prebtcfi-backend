const { ethers } = require("hardhat");

// Contract addresses from the deployment
const MOCK_TOKEN_ADDRESS = "0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9";
const INSURANCE_POOL_ADDRESS = "0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd";
const ORDERBOOK_ADDRESS = "0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB";

// Order ID to fill (from the output of the interact.js script)
const ORDER_ID = 1;

async function main() {
  console.log("Filling order in the Price Insurance Protocol on Core DAO testnet...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  
  // Create a new random account as buyer
  const buyerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`Created random buyer account: ${buyerWallet.address}`);
  
  // Fund the buyer with some native tokens for gas
  console.log("Funding buyer with native tokens for gas...");
  const gasAmount = ethers.parseEther("0.1");
  await deployer.sendTransaction({
    to: buyerWallet.address,
    value: gasAmount,
    gasLimit: 100000,
  });
  console.log(`Funded buyer with 0.1 tCORE`);
  
  // Get contract instances
  const mockToken = await ethers.getContractAt("MockToken", MOCK_TOKEN_ADDRESS);
  const orderbook = await ethers.getContractAt("InsuranceOrderbook", ORDERBOOK_ADDRESS);
  
  try {
    // 1. Get order details first
    console.log(`\n1. Getting details for order ID: ${ORDER_ID}`);
    const order = await orderbook.getOrder(ORDER_ID);
    
    console.log("Order details:");
    console.log(`  Maker: ${order[0]}`);
    console.log(`  Strike Price: ${ethers.formatUnits(order[1], 18)}`);
    console.log(`  Amount: ${ethers.formatUnits(order[2], 18)}`);
    console.log(`  Price: ${ethers.formatUnits(order[3], 18)}`);
    console.log(`  Is Claim Token Order: ${order[4]}`);
    
    // Calculate total payment needed
    const amount = order[2];
    const price = order[3];
    const totalPayment = (amount * price) / ethers.parseUnits("1", 18);
    console.log(`Total payment needed: ${ethers.formatUnits(totalPayment, 6)} USDC`);
    
    // 2. Mint USDC for buyer
    console.log("\n2. Minting USDC tokens for buyer...");
    // Mint extra to cover fees
    const mintAmount = totalPayment * BigInt(102) / BigInt(100); // Add 2% extra for fees
    await mockToken.connect(deployer).mint(buyerWallet.address, mintAmount);
    const buyerBalance = await mockToken.balanceOf(buyerWallet.address);
    console.log(`Buyer balance: ${ethers.formatUnits(buyerBalance, 6)} USDC`);
    
    // 3. Approve orderbook to spend USDC
    console.log("\n3. Approving orderbook to spend USDC...");
    await mockToken.connect(buyerWallet).approve(ORDERBOOK_ADDRESS, ethers.MaxUint256);
    console.log("Approval complete");
    
    // 4. Fill order
    console.log("\n4. Filling the order...");
    const fillTx = await orderbook.connect(buyerWallet).fillOrder(
      ORDER_ID,
      amount,
      {
        gasLimit: 5000000 // Increase gas limit
      }
    );
    console.log("Fill transaction sent, waiting for confirmation...");
    await fillTx.wait();
    console.log("Order filled successfully!");
    
    // 5. Check if order is still active
    try {
      const orderAfter = await orderbook.getOrder(ORDER_ID);
      console.log("\n5. Order after filling:");
      console.log(`  Remaining amount: ${ethers.formatUnits(orderAfter[2], 18)}`);
    } catch (error) {
      console.log("\n5. Order is no longer active (fully filled or cancelled)");
    }
    
    // 6. Check claim token balance of buyer
    const tokens = await orderbook.insurancePool();
    const insurancePool = await ethers.getContractAt("InsurancePool", tokens);
    const strikePrice = order[1];
    
    const tokenInfo = await insurancePool.getInsuranceTokens(strikePrice);
    const claimTokenAddr = tokenInfo[1];
    
    const claimToken = await ethers.getContractAt("InsuranceToken", claimTokenAddr);
    const claimBalance = await claimToken.balanceOf(buyerWallet.address);
    
    console.log("\n6. Buyer's claim token balance:");
    console.log(`  Claim tokens: ${ethers.formatUnits(claimBalance, 18)}`);
    
  } catch (error) {
    console.error("Error during interaction:", error);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
  
  console.log("\nBuying process complete!");
}

// Execute the interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });