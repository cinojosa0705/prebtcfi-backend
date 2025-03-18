const { ethers } = require('ethers');
require('dotenv').config();
const contractAddresses = require('../config/contracts');

// Import ABI from hardhat artifacts or create shortened ABIs
const mockTokenABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address, uint256) returns (bool)",
  "function mint(address, uint256)"
];

const insurancePoolABI = [
  "function COLLATERAL_TOKEN() view returns (address)",
  "function finalized() view returns (bool)",
  "function FinalPrice() view returns (uint256)",
  "function getInsuranceTokens(uint256) view returns (address, address)",
  "function issueInsurance(uint256, uint256, address, address)",
  "function redeemInsurance(uint256, uint256) returns (uint256)",
  "function finalize(uint256)",
  "function settleInsurance(uint256[]) returns (uint256)"
];

const insuranceOrderbookABI = [
  "function insurancePool() view returns (address)",
  "function collateralToken() view returns (address)",
  "function feeRate() view returns (uint256)",
  "function depositCollateral(uint256)",
  "function withdrawCollateral(uint256)",
  "function createClaimTokenOrder(uint256, uint256, uint256) returns (uint256)",
  "function createInsuranceOrder(uint256, uint256, uint256) returns (uint256)",
  "function cancelOrder(uint256)",
  "function fillOrder(uint256, uint256)",
  "function getOrder(uint256) view returns (address, uint256, uint256, uint256, bool)",
  "function isOrderFillable(uint256) view returns (bool)",
  "function userCollateralBalance(address) view returns (uint256)"
];

const tokenABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address, uint256) returns (bool)"
];

// RPC URL for Core DAO testnet (should be in .env file)
const RPC_URL = process.env.RPC_URL || 'https://rpc.test.btcs.network';

// Provider setup
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Get contract instances
const getMockToken = () => {
  return new ethers.Contract(contractAddresses.mockToken, mockTokenABI, provider);
};

const getInsurancePool = () => {
  return new ethers.Contract(contractAddresses.insurancePool, insurancePoolABI, provider);
};

const getInsuranceOrderbook = () => {
  return new ethers.Contract(contractAddresses.insuranceOrderbook, insuranceOrderbookABI, provider);
};

const getTokenContract = (tokenAddress) => {
  return new ethers.Contract(tokenAddress, tokenABI, provider);
};

// Transaction building functions
const buildIssueInsuranceTx = async (strikePrice, amount, collateralTokenRecipient, claimTokenRecipient) => {
  const insurancePool = getInsurancePool();
  const data = insurancePool.interface.encodeFunctionData('issueInsurance', [
    strikePrice,
    amount,
    collateralTokenRecipient,
    claimTokenRecipient
  ]);
  
  return {
    to: contractAddresses.insurancePool,
    data,
    value: '0x0'
  };
};

const buildCreateClaimTokenOrderTx = async (strikePrice, amount, price) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('createClaimTokenOrder', [
    strikePrice,
    amount,
    price
  ]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildCreateInsuranceOrderTx = async (strikePrice, amount, price) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('createInsuranceOrder', [
    strikePrice,
    amount,
    price
  ]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildFillOrderTx = async (orderId, amount) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('fillOrder', [
    orderId,
    amount
  ]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildCancelOrderTx = async (orderId) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('cancelOrder', [orderId]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildDepositCollateralTx = async (amount) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('depositCollateral', [amount]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildWithdrawCollateralTx = async (amount) => {
  const orderbook = getInsuranceOrderbook();
  const data = orderbook.interface.encodeFunctionData('withdrawCollateral', [amount]);
  
  return {
    to: contractAddresses.insuranceOrderbook,
    data,
    value: '0x0'
  };
};

const buildSettleInsuranceTx = async (strikePrices) => {
  const insurancePool = getInsurancePool();
  const data = insurancePool.interface.encodeFunctionData('settleInsurance', [strikePrices]);
  
  return {
    to: contractAddresses.insurancePool,
    data,
    value: '0x0'
  };
};

const buildApproveTokenTx = async (tokenAddress, spender, amount) => {
  const token = getTokenContract(tokenAddress);
  const data = token.interface.encodeFunctionData('approve', [spender, amount]);
  
  return {
    to: tokenAddress,
    data,
    value: '0x0'
  };
};

// Function to mint test USDC to a user's address (for faucet)
const buildMintTestUSDCTx = async (toAddress, amount) => {
  const mockToken = getMockToken();
  const data = mockToken.interface.encodeFunctionData('mint', [toAddress, amount]);
  
  return {
    to: contractAddresses.mockToken,
    data,
    value: '0x0'
  };
};

// Read functions
const getOrders = async (orderIds) => {
  const orderbook = getInsuranceOrderbook();
  const orders = [];
  
  for (const orderId of orderIds) {
    try {
      const order = await orderbook.getOrder(orderId);
      const isFillable = await orderbook.isOrderFillable(orderId);
      
      orders.push({
        orderId,
        maker: order[0],
        strikePrice: order[1].toString(),
        amount: order[2].toString(),
        price: order[3].toString(),
        isClaimTokenOrder: order[4],
        isFillable
      });
    } catch (error) {
      // Order doesn't exist or is already filled/cancelled
      console.log(`Order ${orderId} doesn't exist or is already filled/cancelled`);
    }
  }
  
  return orders;
};

/**
 * Get all active limit orders
 * This function scans for orders from ID 1 up to a reasonable limit
 * and returns all active ones
 */
const getAllOrders = async (maxOrderId = 100) => {
  const orderbook = getInsuranceOrderbook();
  const orders = [];
  
  // Scan from order ID 1 up to maxOrderId
  for (let orderId = 1; orderId <= maxOrderId; orderId++) {
    try {
      const order = await orderbook.getOrder(orderId);
      
      // If order amount is 0, it's already filled or cancelled
      if (order[2].toString() === '0') {
        continue;
      }
      
      const isFillable = await orderbook.isOrderFillable(orderId);
      
      // Get token addresses for this strike price
      const insurancePool = getInsurancePool();
      const [collateralTokenAddr, claimTokenAddr] = await insurancePool.getInsuranceTokens(order[1]);
      
      // Format order data
      orders.push({
        orderId,
        maker: order[0],
        strikePrice: order[1].toString(),
        strikePriceFormatted: ethers.formatUnits(order[1], 18),
        amount: order[2].toString(),
        amountFormatted: ethers.formatUnits(order[2], 18),
        price: order[3].toString(),
        priceFormatted: ethers.formatUnits(order[3], 18),
        isClaimTokenOrder: order[4],
        isFillable,
        tokens: {
          collateralToken: collateralTokenAddr,
          claimToken: claimTokenAddr
        }
      });
    } catch (error) {
      // Order doesn't exist or is already filled/cancelled
      // Silent fail and move to the next ID
    }
  }
  
  return orders;
};

const getUserBalances = async (address) => {
  const mockToken = getMockToken();
  const orderbook = getInsuranceOrderbook();
  const insurancePool = getInsurancePool();
  
  // Get user's collateral balance in the orderbook
  const collateralBalance = await orderbook.userCollateralBalance(address);
  
  // Get user's USDC balance
  const usdcBalance = await mockToken.balanceOf(address);
  
  // For tokens, we need to create another method to get balances for specific strike prices
  
  return {
    usdc: usdcBalance.toString(),
    collateral: collateralBalance.toString()
  };
};

const getTokenInfo = async (tokenAddress) => {
  try {
    const token = getTokenContract(tokenAddress);
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals()
    ]);
    
    return { name, symbol, decimals };
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}:`, error);
    return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
  }
};

const getUserTokensForStrike = async (address, strikePrice) => {
  const insurancePool = getInsurancePool();
  
  // Get token addresses for this strike price
  const [collateralTokenAddr, claimTokenAddr] = await insurancePool.getInsuranceTokens(strikePrice);
  
  // If tokens don't exist for this strike price
  if (collateralTokenAddr === ethers.ZeroAddress) {
    return {
      strikePrice: strikePrice.toString(),
      collateralToken: {
        address: ethers.ZeroAddress,
        balance: '0'
      },
      claimToken: {
        address: ethers.ZeroAddress,
        balance: '0'
      }
    };
  }
  
  // Get token contracts
  const collateralToken = getTokenContract(collateralTokenAddr);
  const claimToken = getTokenContract(claimTokenAddr);
  
  // Get balances
  const [collateralBalance, claimBalance] = await Promise.all([
    collateralToken.balanceOf(address),
    claimToken.balanceOf(address)
  ]);
  
  return {
    strikePrice: strikePrice.toString(),
    collateralToken: {
      address: collateralTokenAddr,
      balance: collateralBalance.toString()
    },
    claimToken: {
      address: claimTokenAddr,
      balance: claimBalance.toString()
    }
  };
};

const getPoolStatus = async () => {
  const insurancePool = getInsurancePool();
  const [isFinalized, finalPrice] = await Promise.all([
    insurancePool.finalized(),
    insurancePool.FinalPrice()
  ]);
  
  return {
    isFinalized,
    finalPrice: finalPrice.toString()
  };
};

module.exports = {
  // Contract getters
  getMockToken,
  getInsurancePool,
  getInsuranceOrderbook,
  getTokenContract,
  
  // Transaction builders
  buildIssueInsuranceTx,
  buildCreateClaimTokenOrderTx,
  buildCreateInsuranceOrderTx,
  buildFillOrderTx,
  buildCancelOrderTx,
  buildDepositCollateralTx,
  buildWithdrawCollateralTx,
  buildSettleInsuranceTx,
  buildApproveTokenTx,
  buildMintTestUSDCTx,
  
  // Read functions
  getOrders,
  getAllOrders,
  getUserBalances,
  getTokenInfo,
  getUserTokensForStrike,
  getPoolStatus,
  
  // Ethereum provider
  provider
};