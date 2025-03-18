const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Price Insurance Protocol...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 1. First deploy a mock ERC20 token to use as collateral for testing
  console.log("Deploying Mock USDC Token...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock USDC", "mUSDC", 6);
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log(`Mock USDC deployed to: ${mockTokenAddress}`);

  // 2. Deploy InsurancePool
  console.log("Deploying InsurancePool...");
  const InsurancePool = await ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(mockTokenAddress);
  await insurancePool.waitForDeployment();
  const insurancePoolAddress = await insurancePool.getAddress();
  console.log(`InsurancePool deployed to: ${insurancePoolAddress}`);

  // 3. Deploy InsuranceOrderbook
  console.log("Deploying InsuranceOrderbook...");
  const InsuranceOrderbook = await ethers.getContractFactory("InsuranceOrderbook");
  const insuranceOrderbook = await InsuranceOrderbook.deploy(insurancePoolAddress);
  await insuranceOrderbook.waitForDeployment();
  const orderBookAddress = await insuranceOrderbook.getAddress();
  console.log(`InsuranceOrderbook deployed to: ${orderBookAddress}`);

  console.log("\nDeployment completed!");
  console.log({
    mockToken: mockTokenAddress,
    insurancePool: insurancePoolAddress,
    insuranceOrderbook: orderBookAddress
  });
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });