const { ethers } = require("hardhat");

// Contract addresses from the deployment
const INSURANCE_POOL_ADDRESS = "0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd";
const ORDERBOOK_ADDRESS = "0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB";

async function main() {
  console.log("Finalizing insurance on Core DAO testnet...");

  // Get deployer account (owner)
  const [deployer] = await ethers.getSigners();
  
  // Get contract instances
  const insurancePool = await ethers.getContractAt("InsurancePool", INSURANCE_POOL_ADDRESS);
  const orderbook = await ethers.getContractAt("InsuranceOrderbook", ORDERBOOK_ADDRESS);
  
  try {
    // 1. Set market to settling state
    console.log("\n1. Setting orderbook to settling state...");
    const settlingTx = await orderbook.setMarketSettling(true, { gasLimit: 2000000 });
    await settlingTx.wait();
    console.log("Market is now in settling state");
    
    // 2. Finalize the insurance pool with a final price
    console.log("\n2. Finalizing insurance pool with a final price...");
    const finalPrice = ethers.parseUnits("18000", 18); // $18,000 - below the strike price of $20,000
    console.log(`Setting final price to: $${ethers.formatUnits(finalPrice, 18)}`);
    
    const finalizeTx = await insurancePool.finalize(finalPrice, { gasLimit: 2000000 });
    await finalizeTx.wait();
    console.log("Insurance pool finalized");
    
    // 3. Check finalization status
    const isFinalized = await insurancePool.finalized();
    const actualFinalPrice = await insurancePool.FinalPrice();
    
    console.log("\n3. Finalization status:");
    console.log(`  Finalized: ${isFinalized}`);
    console.log(`  Final price: $${ethers.formatUnits(actualFinalPrice, 18)}`);
    
    console.log("\nFinalization complete! Holders can now settle their insurance positions.");
    
  } catch (error) {
    console.error("Error during finalization:", error);
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