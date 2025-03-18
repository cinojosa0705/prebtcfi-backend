const blockchain = require('../services/blockchain');
const contractAddresses = require('../config/contracts');
const { ethers } = require('ethers');

/**
 * Build transaction for issuing insurance
 */
const buildIssueInsurance = async (req, res) => {
  try {
    const { strikePrice, amount, collateralTokenRecipient, claimTokenRecipient } = req.body;
    
    if (!strikePrice || !amount || !collateralTokenRecipient || !claimTokenRecipient) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePriceWei = ethers.parseUnits(strikePrice, 18);
    const amountWei = ethers.parseUnits(amount, 18);
    
    const tx = await blockchain.buildIssueInsuranceTx(
      strikePriceWei, 
      amountWei, 
      collateralTokenRecipient,
      claimTokenRecipient
    );
    
    // First users need to approve tokens for the insurance pool
    const mockToken = blockchain.getMockToken();
    const approveTx = await blockchain.buildApproveTokenTx(
      contractAddresses.mockToken,
      contractAddresses.insurancePool,
      ethers.MaxUint256
    );
    
    return res.json({
      preparatory: [approveTx],
      transaction: tx,
      gasLimit: 5000000
    });
  } catch (error) {
    console.error('Error building issue insurance transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for creating a claim token order
 */
const buildCreateClaimTokenOrder = async (req, res) => {
  try {
    const { strikePrice, amount, price } = req.body;
    
    if (!strikePrice || !amount || !price) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePriceWei = ethers.parseUnits(strikePrice, 18);
    const amountWei = ethers.parseUnits(amount, 18);
    const priceWei = ethers.parseUnits(price, 18);
    
    // Get the insurance pool to find token addresses
    const insurancePool = blockchain.getInsurancePool();
    const [collateralTokenAddr, claimTokenAddr] = await insurancePool.getInsuranceTokens(strikePriceWei);
    
    if (collateralTokenAddr === ethers.ZeroAddress) {
      return res.status(400).json({ error: 'No insurance tokens exist for this strike price' });
    }
    
    // First users need to approve the orderbook to transfer their claim tokens
    const approveTx = await blockchain.buildApproveTokenTx(
      claimTokenAddr,
      contractAddresses.insuranceOrderbook,
      ethers.MaxUint256
    );
    
    const tx = await blockchain.buildCreateClaimTokenOrderTx(strikePriceWei, amountWei, priceWei);
    
    return res.json({
      preparatory: [approveTx],
      transaction: tx,
      gasLimit: 5000000
    });
  } catch (error) {
    console.error('Error building create claim token order transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for creating an insurance order
 */
const buildCreateInsuranceOrder = async (req, res) => {
  try {
    const { strikePrice, amount, price } = req.body;
    
    if (!strikePrice || !amount || !price) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePriceWei = ethers.parseUnits(strikePrice, 18);
    const amountWei = ethers.parseUnits(amount, 18);
    const priceWei = ethers.parseUnits(price, 18);
    
    const tx = await blockchain.buildCreateInsuranceOrderTx(strikePriceWei, amountWei, priceWei);
    
    return res.json({
      transaction: tx,
      gasLimit: 5000000
    });
  } catch (error) {
    console.error('Error building create insurance order transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for filling an order
 */
const buildFillOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const amountWei = ethers.parseUnits(amount, 18);
    
    // Check if order exists and is fillable
    const orderbook = blockchain.getInsuranceOrderbook();
    try {
      const order = await orderbook.getOrder(orderId);
      const isFillable = await orderbook.isOrderFillable(orderId);
      
      if (!isFillable) {
        return res.status(400).json({ error: 'Order is not fillable' });
      }
      
      // Calculate payment amount based on order
      const price = order[3];
      const paymentAmount = (amountWei * price) / ethers.parseUnits('1', 18);
      
      // First users need to approve the orderbook to transfer their USDC
      const approveTx = await blockchain.buildApproveTokenTx(
        contractAddresses.mockToken,
        contractAddresses.insuranceOrderbook,
        paymentAmount
      );
      
      const tx = await blockchain.buildFillOrderTx(orderId, amountWei);
      
      return res.json({
        preparatory: [approveTx],
        transaction: tx,
        gasLimit: 5000000
      });
    } catch (error) {
      return res.status(400).json({ error: 'Order does not exist or is already filled/cancelled' });
    }
  } catch (error) {
    console.error('Error building fill order transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for cancelling an order
 */
const buildCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const tx = await blockchain.buildCancelOrderTx(orderId);
    
    return res.json({
      transaction: tx,
      gasLimit: 2000000
    });
  } catch (error) {
    console.error('Error building cancel order transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for depositing collateral
 */
const buildDepositCollateral = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    
    // First users need to approve the orderbook to transfer their USDC
    const approveTx = await blockchain.buildApproveTokenTx(
      contractAddresses.mockToken,
      contractAddresses.insuranceOrderbook,
      amountWei
    );
    
    const tx = await blockchain.buildDepositCollateralTx(amountWei);
    
    return res.json({
      preparatory: [approveTx],
      transaction: tx,
      gasLimit: 2000000
    });
  } catch (error) {
    console.error('Error building deposit collateral transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for withdrawing collateral
 */
const buildWithdrawCollateral = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    
    const tx = await blockchain.buildWithdrawCollateralTx(amountWei);
    
    return res.json({
      transaction: tx,
      gasLimit: 2000000
    });
  } catch (error) {
    console.error('Error building withdraw collateral transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Build transaction for settling insurance
 */
const buildSettleInsurance = async (req, res) => {
  try {
    const { strikePrices } = req.body;
    
    if (!strikePrices || !Array.isArray(strikePrices) || strikePrices.length === 0) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Convert user-friendly values to contract format
    const strikePricesWei = strikePrices.map(sp => ethers.parseUnits(sp, 18));
    
    const tx = await blockchain.buildSettleInsuranceTx(strikePricesWei);
    
    return res.json({
      transaction: tx,
      gasLimit: 3000000
    });
  } catch (error) {
    console.error('Error building settle insurance transaction:', error);
    return res.status(500).json({ error: 'Failed to build transaction' });
  }
};

/**
 * Faucet endpoint to get test USDC
 */
const requestFaucetTokens = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }
    
    // Validate the address
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    // Check for private key in environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ error: 'Faucet not configured: missing private key in environment' });
    }
    
    // Default amount is 10,000 USDC (USDC has 6 decimals)
    const amount = ethers.parseUnits("10000", 6);
    
    // Get provider and create wallet
    const wallet = new ethers.Wallet(privateKey, blockchain.provider);
    const mockToken = new ethers.Contract(
      contractAddresses.mockToken,
      [
        "function mint(address to, uint256 amount)",
        "function balanceOf(address) view returns (uint256)"
      ],
      wallet
    );
    
    // Check user's current balance
    const userBalanceBefore = await mockToken.balanceOf(address);
    
    // Execute the mint transaction
    console.log(`Executing faucet: minting ${ethers.formatUnits(amount, 6)} USDC to ${address}`);
    const tx = await mockToken.mint(address, amount, { gasLimit: 2000000 });
    
    // Wait for transaction confirmation
    console.log(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.hash}`);
    
    // Check new balance
    const userBalanceAfter = await mockToken.balanceOf(address);
    const balanceIncrease = userBalanceAfter - userBalanceBefore;
    
    return res.json({
      success: true,
      amount: ethers.formatUnits(amount, 6),
      amountReceived: ethers.formatUnits(balanceIncrease, 6),
      transaction: {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: wallet.address,
        to: address
      },
      message: `Successfully minted ${ethers.formatUnits(amount, 6)} test USDC to your wallet.`
    });
  } catch (error) {
    console.error('Error executing faucet request:', error);
    return res.status(500).json({ 
      error: 'Failed to execute faucet transaction',
      details: error.message
    });
  }
};

module.exports = {
  buildIssueInsurance,
  buildCreateClaimTokenOrder,
  buildCreateInsuranceOrder,
  buildFillOrder,
  buildCancelOrder,
  buildDepositCollateral,
  buildWithdrawCollateral,
  buildSettleInsurance,
  requestFaucetTokens
};