const express = require('express');
const router = express.Router();
const queriesController = require('../controllers/queries');

/**
 * @swagger
 * /api/queries/order/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Queries]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: number
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/order/:orderId', queriesController.getOrder);

/**
 * @swagger
 * /api/queries/orders:
 *   get:
 *     summary: Get multiple orders
 *     tags: [Queries]
 *     parameters:
 *       - in: query
 *         name: orderIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of order IDs
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders', queriesController.getMultipleOrders);

/**
 * @swagger
 * /api/queries/balances/{address}:
 *   get:
 *     summary: Get user balances
 *     tags: [Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: User's wallet address
 *     responses:
 *       200:
 *         description: Balances retrieved successfully
 */
router.get('/balances/:address', queriesController.getUserBalances);

/**
 * @swagger
 * /api/queries/tokens/{address}/{strikePrice}:
 *   get:
 *     summary: Get user token balances for a specific strike price
 *     tags: [Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: User's wallet address
 *       - in: path
 *         name: strikePrice
 *         required: true
 *         schema:
 *           type: string
 *         description: Strike price (e.g., "20000")
 *     responses:
 *       200:
 *         description: Token balances retrieved successfully
 */
router.get('/tokens/:address/:strikePrice', queriesController.getUserTokensForStrike);

/**
 * @swagger
 * /api/queries/strike/{strikePrice}:
 *   get:
 *     summary: Get information about a specific strike price
 *     tags: [Queries]
 *     parameters:
 *       - in: path
 *         name: strikePrice
 *         required: true
 *         schema:
 *           type: string
 *         description: Strike price (e.g., "20000")
 *     responses:
 *       200:
 *         description: Strike price information retrieved successfully
 *       404:
 *         description: No tokens exist for this strike price
 */
router.get('/strike/:strikePrice', queriesController.getStrikePriceInfo);

/**
 * @swagger
 * /api/queries/pool-status:
 *   get:
 *     summary: Get insurance pool status
 *     tags: [Queries]
 *     responses:
 *       200:
 *         description: Pool status retrieved successfully
 */
router.get('/pool-status', queriesController.getPoolStatus);

/**
 * @swagger
 * /api/queries/contracts:
 *   get:
 *     summary: Get contract addresses
 *     tags: [Queries]
 *     responses:
 *       200:
 *         description: Contract addresses retrieved successfully
 */
router.get('/contracts', queriesController.getContractAddresses);

/**
 * @swagger
 * /api/queries/all-orders:
 *   get:
 *     summary: Get all active limit orders
 *     tags: [Queries]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of order IDs to scan (default 100)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       500:
 *         description: Failed to fetch order data
 */
router.get('/all-orders', queriesController.getAllOrders);

module.exports = router;