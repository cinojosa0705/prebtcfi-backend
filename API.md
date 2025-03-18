# Price Insurance Protocol API Documentation

This document provides information about the Price Insurance Protocol API which abstracts interaction with the smart contracts on the Core DAO blockchain.

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file:
   ```
   RPC_URL=https://rpc.test.btcs.network
   BLOCKCHAIN_NETWORK=coretestnet
   PORT=3001
   ```

### Starting the Server

```
npm run server
```

For development with auto-restart:
```
npm run dev
```

The server will run on port 3000 by default (or the port specified in the `.env` file).

## API Endpoints

The API is divided into two main sections:

1. **Queries**: Read-only operations to fetch data from the blockchain
2. **Transactions**: Generate transactions for users to sign and submit to the blockchain

### Swagger Documentation

The API comes with Swagger documentation available at:
```
http://localhost:3000/api-docs
```

## Query Endpoints

### Get Contract Addresses

```
GET /api/queries/contracts
```

Returns the addresses of the deployed contracts on the current network.

### Get Pool Status

```
GET /api/queries/pool-status
```

Returns the status of the insurance pool (finalized, final price).

### Get Order Details

```
GET /api/queries/order/{orderId}
```

Returns details about a specific order.

### Get Multiple Orders

```
GET /api/queries/orders?orderIds=1,2,3
```

Returns details about multiple orders.

### Get All Active Orders

```
GET /api/queries/all-orders
```

Optional query parameters:
- `limit`: Maximum number of order IDs to scan (default: 100)

Returns all active orders in the orderbook, grouped by strike price. The response includes:
- `totalOrders`: Total number of active orders
- `ordersByStrikePrice`: Orders grouped by strike price with separate lists for claim token orders and insurance orders
- `allOrders`: Flat list of all orders

### Get User Balances

```
GET /api/queries/balances/{address}
```

Returns the user's balances (USDC, collateral).

### Get User Token Balances for Strike Price

```
GET /api/queries/tokens/{address}/{strikePrice}
```

Returns the user's token balances for a specific strike price.

### Get Strike Price Information

```
GET /api/queries/strike/{strikePrice}
```

Returns information about a specific strike price (token addresses, etc.).

## Transaction Endpoints

Each transaction endpoint returns a transaction object that can be signed and submitted to the blockchain.

The response format includes:
- `preparatory`: Optional array of transactions that need to be executed first (like approvals)
- `transaction`: The main transaction to be executed
- `gasLimit`: Recommended gas limit for the transaction

### Issue Insurance

```
POST /api/transactions/issue-insurance
```

Body:
```json
{
  "strikePrice": "20000",
  "amount": "0.001",
  "collateralTokenRecipient": "0x...",
  "claimTokenRecipient": "0x..."
}
```

### Create Claim Token Order

```
POST /api/transactions/create-claim-token-order
```

Body:
```json
{
  "strikePrice": "20000",
  "amount": "0.001",
  "price": "100"
}
```

### Create Insurance Order

```
POST /api/transactions/create-insurance-order
```

Body:
```json
{
  "strikePrice": "20000",
  "amount": "0.001",
  "price": "100"
}
```

### Fill Order

```
POST /api/transactions/fill-order
```

Body:
```json
{
  "orderId": 1,
  "amount": "0.001"
}
```

### Cancel Order

```
POST /api/transactions/cancel-order
```

Body:
```json
{
  "orderId": 1
}
```

### Deposit Collateral

```
POST /api/transactions/deposit-collateral
```

Body:
```json
{
  "amount": "1000"
}
```

### Withdraw Collateral

```
POST /api/transactions/withdraw-collateral
```

Body:
```json
{
  "amount": "1000"
}
```

### Settle Insurance

```
POST /api/transactions/settle-insurance
```

Body:
```json
{
  "strikePrices": ["20000"]
}
```

### Request Test USDC (Faucet)

```
POST /api/transactions/faucet
```

Body:
```json
{
  "address": "0x..."
}
```

Response:
```json
{
  "success": true,
  "amount": "10000.0",
  "amountReceived": "10000.0",
  "transaction": {
    "hash": "0x...",
    "blockNumber": 123456,
    "from": "0x...",
    "to": "0x..."
  },
  "message": "Successfully minted 10000.0 test USDC to your wallet."
}
```

This endpoint directly mints 10,000 test USDC to the specified address using the server's private key. The transaction is executed on the server side, so users don't need to sign anything.

## Frontend Integration

To integrate with a frontend application, you can use these APIs to:

1. Display user balances and token holdings
2. Show available orders in the orderbook
3. Generate transactions for users to sign with their wallet

### Example: User Flow

1. User connects wallet to the frontend
2. Frontend fetches user balances and available orders
3. User decides to issue insurance:
   - Frontend calls `/api/transactions/issue-insurance` with user inputs
   - Frontend gets transaction data from the response
   - Frontend sends transaction to wallet for signing
   - User signs and submits transaction to the blockchain

## WebSocket Support (Future Enhancement)

WebSocket support for real-time updates will be added in future versions.

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Bad request (missing parameters, etc.)
- `404`: Not found
- `500`: Server error

Error responses include a descriptive message:

```json
{
  "error": "Error message"
}
```

## Security Considerations

This API is designed to be a middleware that generates unsigned transactions. It does not store or manage private keys or sign transactions itself. All signing should happen in the user's wallet.

## Testing

The API can be tested using tools like Postman or the included Swagger documentation.

## Contract Addresses

The current contract addresses on Core DAO testnet are:

- Mock USDC Token: `0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9`
- InsurancePool: `0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd`
- InsuranceOrderbook: `0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB`