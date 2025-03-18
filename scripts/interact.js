const { ethers } = require("hardhat");

// Contract addresses from the deployment
const MOCK_TOKEN_ADDRESS = "0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9";
const INSURANCE_POOL_ADDRESS = "0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd";
const ORDERBOOK_ADDRESS = "0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB";

async function main() {
  console.log("Interacting with Price Insurance Protocol on Core DAO testnet...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get contract instances
  const mockToken = await ethers.getContractAt("MockToken", MOCK_TOKEN_ADDRESS);
  const insurancePool = await ethers.getContractAt("InsurancePool", INSURANCE_POOL_ADDRESS);
  const orderbook = await ethers.getContractAt("InsuranceOrderbook", ORDERBOOK_ADDRESS);
  
  // 1. Mint some mock USDC tokens to our account
  console.log("\n1. Minting mock USDC tokens...");
  const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  await mockToken.mint(deployer.address, mintAmount);
  const balance = await mockToken.balanceOf(deployer.address);
  console.log(`Minted ${ethers.formatUnits(balance, 6)} mock USDC to ${deployer.address}`);
  
  // 2. Approve insurance pool to spend our tokens
  console.log("\n2. Approving insurance pool to spend tokens...");
  await mockToken.approve(INSURANCE_POOL_ADDRESS, ethers.MaxUint256);
  console.log("Approval complete");
  
  // Check allowance
  const allowance = await mockToken.allowance(deployer.address, INSURANCE_POOL_ADDRESS);
  console.log(`Allowance for InsurancePool: ${ethers.formatUnits(allowance, 6)}`);
  
  // 3. Issue insurance at a strike price of 20,000
  console.log("\n3. Issuing insurance...");
  const strikePrice = ethers.parseUnits("20000", 18); // $20,000 strike price
  const insuranceAmount = ethers.parseUnits("0.001", 18); // 0.001 Insurance token
  
  try {
    console.log("Attempting to issue insurance with overrides...");
    const issueTx = await insurancePool.issueInsurance(
      strikePrice,
      insuranceAmount,
      deployer.address, // collateral token recipient
      deployer.address, // claim token recipient
      {
        gasLimit: 5000000, // Increase gas limit
      }
    );
    console.log("Transaction sent, waiting for confirmation...");
    await issueTx.wait();
    console.log(`Insurance issued at strike price: $20,000 for ${ethers.formatUnits(insuranceAmount, 18)} tokens`);
    
    // 4. Get the token addresses for this strike price
    const tokens = await insurancePool.getInsuranceTokens(strikePrice);
    const collateralTokenAddr = tokens[0];
    const claimTokenAddr = tokens[1];
    console.log(`Collateral token address: ${collateralTokenAddr}`);
    console.log(`Claim token address: ${claimTokenAddr}`);
    
    // Get token contracts
    const collateralToken = await ethers.getContractAt("InsuranceToken", collateralTokenAddr);
    const claimToken = await ethers.getContractAt("InsuranceToken", claimTokenAddr);
    
    // Check balances
    const collateralBalance = await collateralToken.balanceOf(deployer.address);
    const claimBalance = await claimToken.balanceOf(deployer.address);
    console.log(`Collateral token balance: ${ethers.formatUnits(collateralBalance, 18)}`);
    console.log(`Claim token balance: ${ethers.formatUnits(claimBalance, 18)}`);
    
    // 5. Approve orderbook to transfer claim tokens
    console.log("\n4. Approving orderbook to transfer claim tokens...");
    await claimToken.approve(ORDERBOOK_ADDRESS, ethers.MaxUint256);
    console.log("Approval complete");
    
    // 6. Create an order to sell claim tokens
    console.log("\n5. Creating an order to sell claim tokens...");
    const orderPrice = ethers.parseUnits("100", 18); // Price of 100 USDC per token
    console.log("Attempting to create order with overrides...");
    const createOrderTx = await orderbook.createClaimTokenOrder(
      strikePrice,
      insuranceAmount,
      orderPrice,
      {
        gasLimit: 5000000, // Increase gas limit
      }
    );
    console.log("Order transaction sent, waiting for confirmation...");
    const orderReceipt = await createOrderTx.wait();
    
    // Find the OrderCreated event to get the orderId
    const orderCreatedEvents = orderReceipt.logs
      .filter(log => log.fragment && log.fragment.name === 'OrderCreated')
      .map(log => {
        const parsedLog = orderbook.interface.parseLog(log);
        return parsedLog.args;
      });
    
    if (orderCreatedEvents.length > 0) {
      const orderId = orderCreatedEvents[0][0];
      console.log(`Order created with ID: ${orderId}`);
      
      // 7. Get order details
      console.log("\n6. Order details:");
      const order = await orderbook.getOrder(orderId);
      console.log(`  Maker: ${order[0]}`);
      console.log(`  Strike Price: ${ethers.formatUnits(order[1], 18)}`);
      console.log(`  Amount: ${ethers.formatUnits(order[2], 18)}`);
      console.log(`  Price: ${ethers.formatUnits(order[3], 18)}`);
      console.log(`  Is Claim Token Order: ${order[4]}`);
    } else {
      console.log("Failed to find OrderCreated event");
    }
  } catch (error) {
    console.error("Error during interaction:", error);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
  
  console.log("\nInteraction complete!");
}

// Execute the interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });