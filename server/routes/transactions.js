const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions');

/**
 * @swagger
 * /api/transactions/issue-insurance:
 *   post:
 *     summary: Build a transaction to issue insurance
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - strikePrice
 *               - amount
 *               - collateralTokenRecipient
 *               - claimTokenRecipient
 *             properties:
 *               strikePrice:
 *                 type: string
 *                 description: The strike price (e.g., "20000")
 *               amount:
 *                 type: string
 *                 description: The amount of insurance to issue (e.g., "0.001")
 *               collateralTokenRecipient:
 *                 type: string
 *                 description: The address that will receive the collateral tokens
 *               claimTokenRecipient:
 *                 type: string
 *                 description: The address that will receive the claim tokens
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/issue-insurance', transactionsController.buildIssueInsurance);

/**
 * @swagger
 * /api/transactions/create-claim-token-order:
 *   post:
 *     summary: Build a transaction to create a claim token order
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - strikePrice
 *               - amount
 *               - price
 *             properties:
 *               strikePrice:
 *                 type: string
 *                 description: The strike price (e.g., "20000")
 *               amount:
 *                 type: string
 *                 description: The amount of tokens to sell (e.g., "0.001")
 *               price:
 *                 type: string
 *                 description: The price per token (e.g., "100")
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/create-claim-token-order', transactionsController.buildCreateClaimTokenOrder);

/**
 * @swagger
 * /api/transactions/create-insurance-order:
 *   post:
 *     summary: Build a transaction to create an insurance order
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - strikePrice
 *               - amount
 *               - price
 *             properties:
 *               strikePrice:
 *                 type: string
 *                 description: The strike price (e.g., "20000")
 *               amount:
 *                 type: string
 *                 description: The amount of insurance to sell (e.g., "0.001")
 *               price:
 *                 type: string
 *                 description: The price per token (e.g., "100")
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/create-insurance-order', transactionsController.buildCreateInsuranceOrder);

/**
 * @swagger
 * /api/transactions/fill-order:
 *   post:
 *     summary: Build a transaction to fill an order
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: number
 *                 description: The ID of the order to fill
 *               amount:
 *                 type: string
 *                 description: The amount to fill (e.g., "0.001")
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/fill-order', transactionsController.buildFillOrder);

/**
 * @swagger
 * /api/transactions/cancel-order:
 *   post:
 *     summary: Build a transaction to cancel an order
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: number
 *                 description: The ID of the order to cancel
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/cancel-order', transactionsController.buildCancelOrder);

/**
 * @swagger
 * /api/transactions/deposit-collateral:
 *   post:
 *     summary: Build a transaction to deposit collateral
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: string
 *                 description: The amount of collateral to deposit (e.g., "1000")
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/deposit-collateral', transactionsController.buildDepositCollateral);

/**
 * @swagger
 * /api/transactions/withdraw-collateral:
 *   post:
 *     summary: Build a transaction to withdraw collateral
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: string
 *                 description: The amount of collateral to withdraw (e.g., "1000")
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/withdraw-collateral', transactionsController.buildWithdrawCollateral);

/**
 * @swagger
 * /api/transactions/settle-insurance:
 *   post:
 *     summary: Build a transaction to settle insurance
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - strikePrices
 *             properties:
 *               strikePrices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of strike prices to settle (e.g., ["20000"])
 *     responses:
 *       200:
 *         description: Transaction data built successfully
 */
router.post('/settle-insurance', transactionsController.buildSettleInsurance);

/**
 * @swagger
 * /api/transactions/faucet:
 *   post:
 *     summary: Get test USDC from the faucet
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Wallet address to receive the test USDC
 *     responses:
 *       200:
 *         description: Successfully minted tokens to the address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 amount:
 *                   type: string
 *                   description: The amount of USDC minted
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     hash:
 *                       type: string
 *                     blockNumber:
 *                       type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid address or missing parameters
 *       500:
 *         description: Server error executing the faucet transaction
 */
router.post('/faucet', transactionsController.requestFaucetTokens);

module.exports = router;