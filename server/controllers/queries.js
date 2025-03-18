const blockchain = require('../services/blockchain');
const contractAddresses = require('../config/contracts');
const { ethers } = require('ethers');

/**
 * Get order details
 */
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const orderIds = [parseInt(orderId)];
    const orders = await blockchain.getOrders(orderIds);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or already filled/cancelled' });
    }
    
    return res.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

/**
 * Get multiple orders
 */
const getMultipleOrders = async (req, res) => {
  try {
    const { orderIds } = req.query;
    
    if (!orderIds) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Parse the comma-separated list or array of order IDs
    let orderIdArray;
    if (Array.isArray(orderIds)) {
      orderIdArray = orderIds.map(id => parseInt(id));
    } else {
      orderIdArray = orderIds.split(',').map(id => parseInt(id.trim()));
    }
    
    // Get order details
    const orders = await blockchain.getOrders(orderIdArray);
    
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

/**
 * Get user balances
 */
const getUserBalances = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const balances = await blockchain.getUserBalances(address);
    
    return res.json(balances);
  } catch (error) {
    console.error('Error fetching user balances:', error);
    return res.status(500).json({ error: 'Failed to fetch user balances' });
  }
};

/**
 * Get user token balances for a specific strike price
 */
const getUserTokensForStrike = async (req, res) => {
  try {
    const { address, strikePrice } = req.params;
    
    if (!address || !strikePrice) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePriceWei = ethers.parseUnits(strikePrice, 18);
    
    const tokenInfo = await blockchain.getUserTokensForStrike(address, strikePriceWei);
    
    return res.json(tokenInfo);
  } catch (error) {
    console.error('Error fetching user token balances:', error);
    return res.status(500).json({ error: 'Failed to fetch user token balances' });
  }
};

/**
 * Get information about a specific strike price (token addresses, etc.)
 */
const getStrikePriceInfo = async (req, res) => {
  try {
    const { strikePrice } = req.params;
    
    if (!strikePrice) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePriceWei = ethers.parseUnits(strikePrice, 18);
    
    const insurancePool = blockchain.getInsurancePool();
    const [collateralTokenAddr, claimTokenAddr] = await insurancePool.getInsuranceTokens(strikePriceWei);
    
    if (collateralTokenAddr === ethers.ZeroAddress) {
      return res.status(404).json({ error: 'No tokens exist for this strike price' });
    }
    
    // Get token details
    const [collateralTokenInfo, claimTokenInfo] = await Promise.all([
      blockchain.getTokenInfo(collateralTokenAddr),
      blockchain.getTokenInfo(claimTokenAddr)
    ]);
    
    return res.json({
      strikePrice,
      collateralToken: {
        address: collateralTokenAddr,
        ...collateralTokenInfo
      },
      claimToken: {
        address: claimTokenAddr,
        ...claimTokenInfo
      }
    });
  } catch (error) {
    console.error('Error fetching strike price info:', error);
    return res.status(500).json({ error: 'Failed to fetch strike price information' });
  }
};

/**
 * Get insurance pool status
 */
const getPoolStatus = async (req, res) => {
  try {
    const status = await blockchain.getPoolStatus();
    
    // Convert final price from wei to human-readable format
    if (status.finalPrice && status.finalPrice !== '0') {
      status.finalPriceFormatted = ethers.formatUnits(status.finalPrice, 18);
    }
    
    return res.json(status);
  } catch (error) {
    console.error('Error fetching pool status:', error);
    return res.status(500).json({ error: 'Failed to fetch pool status' });
  }
};

/**
 * Get contract addresses
 */
const getContractAddresses = async (req, res) => {
  try {
    return res.json(contractAddresses);
  } catch (error) {
    console.error('Error fetching contract addresses:', error);
    return res.status(500).json({ error: 'Failed to fetch contract addresses' });
  }
};

/**
 * Get all active limit orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { limit } = req.query;
    const maxLimit = limit ? parseInt(limit) : 100;
    
    // Get all active orders
    const orders = await blockchain.getAllOrders(maxLimit);
    
    // Group orders by strike price
    const ordersByStrikePrice = {};
    orders.forEach(order => {
      const strikePriceKey = order.strikePriceFormatted;
      if (!ordersByStrikePrice[strikePriceKey]) {
        ordersByStrikePrice[strikePriceKey] = {
          strikePrice: order.strikePrice,
          strikePriceFormatted: strikePriceKey,
          tokens: order.tokens,
          claimTokenOrders: [],
          insuranceOrders: []
        };
      }
      
      // Add to appropriate list based on order type
      if (order.isClaimTokenOrder) {
        ordersByStrikePrice[strikePriceKey].claimTokenOrders.push(order);
      } else {
        ordersByStrikePrice[strikePriceKey].insuranceOrders.push(order);
      }
    });
    
    return res.json({
      totalOrders: orders.length,
      ordersByStrikePrice: Object.values(ordersByStrikePrice),
      allOrders: orders
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({ error: 'Failed to fetch order data' });
  }
};

module.exports = {
  getOrder,
  getMultipleOrders,
  getAllOrders,
  getUserBalances,
  getUserTokensForStrike,
  getStrikePriceInfo,
  getPoolStatus,
  getContractAddresses
};