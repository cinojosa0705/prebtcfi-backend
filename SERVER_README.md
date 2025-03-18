# Price Insurance Protocol API Server

This is the API server for the Price Insurance Protocol, a decentralized platform for issuing and trading price insurance on the Core DAO blockchain.

## Deployment on Railway

This server is configured for easy deployment on Railway:

1. Connect your GitHub repository to Railway
2. Configure the required environment variables:
   - `RPC_URL` - The RPC URL for the Core DAO testnet
   - `BLOCKCHAIN_NETWORK` - The network name (e.g., "coretestnet")
   - `PORT` - The server port (Railway will set this automatically)

Railway will automatically detect the Node.js project and run the `start` script defined in package.json.

## Local Development

To run the server locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `.env.example` template

3. Start the development server with auto-reload:
   ```
   npm run dev
   ```

4. Or start the server without auto-reload:
   ```
   npm start
   ```

The server will be available at `http://localhost:3001` by default.

## Environment Variables

- `RPC_URL`: URL for the Core DAO blockchain RPC endpoint
- `BLOCKCHAIN_NETWORK`: Network name to determine which contract addresses to use
- `PORT`: Port for the server to listen on (default: 3001)

## Documentation

The API documentation is available at `/api-docs` when the server is running.

For a complete guide to the API endpoints, see the [API.md](API.md) file.

## Contract Addresses

The server uses the contract addresses specified in `server/config/contracts.js`. These addresses are organized by network name.

## API Structure

- `/api/queries/*` - Read-only endpoints for getting data from the blockchain
- `/api/transactions/*` - Endpoints for building transactions to be signed by users

## Testing

Test scripts for the API endpoints are available in:
- `test-api.js` - Tests for query endpoints
- `test-tx-api.js` - Tests for transaction endpoints
- `test-all-orders.js` - Tests for the all-orders endpoint