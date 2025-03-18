const { ethers } = require("hardhat");

// Contract addresses from the deployment
const MOCK_TOKEN_ADDRESS = "0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9";
const INSURANCE_POOL_ADDRESS = "0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd";

async function main() {
  console.log("Settling insurance on Core DAO testnet...");

  // Get deployer account (token holder)
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get contract instances
  const mockToken = await ethers.getContractAt("MockToken", MOCK_TOKEN_ADDRESS);
  const insurancePool = await ethers.getContractAt("InsurancePool", INSURANCE_POOL_ADDRESS);
  
  try {
    // 1. Check if pool is finalized
    const isFinalized = await insurancePool.finalized();
    const finalPrice = await insurancePool.FinalPrice();
    
    console.log("\n1. Pool finalization status:");
    console.log(`  Finalized: ${isFinalized}`);
    console.log(`  Final price: $${ethers.formatUnits(finalPrice, 18)}`);
    
    if (!isFinalized) {
      console.log("Pool is not finalized yet. Cannot settle.");
      return;
    }
    
    // 2. Get balance before settlement
    const initialBalance = await mockToken.balanceOf(deployer.address);
    console.log(`\n2. Initial USDC balance: ${ethers.formatUnits(initialBalance, 6)}`);
    
    // 3. Find all strike prices with tokens
    console.log("\n3. Finding strike prices to settle...");
    const strikePrice = ethers.parseUnits("20000", 18); // We know we issued at this strike price
    
    // Get token addresses
    const tokens = await insurancePool.getInsuranceTokens(strikePrice);
    const collateralTokenAddr = tokens[0];
    const claimTokenAddr = tokens[1];
    
    const collateralToken = await ethers.getContractAt("InsuranceToken", collateralTokenAddr);
    const claimToken = await ethers.getContractAt("InsuranceToken", claimTokenAddr);
    
    // Check token balances
    const collateralBalance = await collateralToken.balanceOf(deployer.address);
    const claimBalance = await claimToken.balanceOf(deployer.address);
    
    console.log(`  Strike price: $${ethers.formatUnits(strikePrice, 18)}`);
    console.log(`  Collateral token balance: ${ethers.formatUnits(collateralBalance, 18)}`);
    console.log(`  Claim token balance: ${ethers.formatUnits(claimBalance, 18)}`);
    
    if (collateralBalance == 0n && claimBalance == 0n) {
      console.log("No tokens to settle.");
      return;
    }
    
    // 4. Settle insurance
    console.log("\n4. Settling insurance...");
    const settleTx = await insurancePool.settleInsurance([strikePrice], { gasLimit: 3000000 });
    await settleTx.wait();
    console.log("Settlement complete");
    
    // 5. Check final balance
    const finalBalance = await mockToken.balanceOf(deployer.address);
    console.log(`\n5. Final USDC balance: ${ethers.formatUnits(finalBalance, 6)}`);
    console.log(`   Received payment: ${ethers.formatUnits(finalBalance - initialBalance, 6)} USDC`);
    
    // 6. Verify tokens were burned
    const collateralBalanceAfter = await collateralToken.balanceOf(deployer.address);
    const claimBalanceAfter = await claimToken.balanceOf(deployer.address);
    
    console.log("\n6. Token balances after settlement:");
    console.log(`  Collateral token balance: ${ethers.formatUnits(collateralBalanceAfter, 18)}`);
    console.log(`  Claim token balance: ${ethers.formatUnits(claimBalanceAfter, 18)}`);
    
  } catch (error) {
    console.error("Error during settlement:", error);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

// Execute the interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });