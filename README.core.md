# Price Insurance Protocol on Core DAO Testnet

This document contains information about the Price Insurance Protocol deployment on the Core DAO testnet.

## Deployment Information

- Network: Core DAO Testnet
- RPC URL: https://rpc.test.btcs.network
- Chain ID: 1115
- Currency Symbol: tCORE

## Contract Addresses

- **Mock USDC Token**: `0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9`
- **InsurancePool**: `0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd`
- **InsuranceOrderbook**: `0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB`

## Insurance Tokens for Strike Price $20,000

- **Collateral Token**: `0x0c69C6a73873384D435e27B03f249336d98178d7`
- **Claim Token**: `0x26a6064e96dDe8dA6B0B7B8DA3c7c609349e2110`

## Deployment Status

The protocol has been successfully deployed and tested with the following flow:

1. Deployed all contracts
2. Minted mock USDC tokens
3. Issued insurance tokens at a strike price of $20,000
4. Created an order on the orderbook to sell claim tokens
5. Finalized the pool with a final price of $18,000 (below strike price)
6. Successfully settled and claimed insurance compensation

## Scripts

The following scripts were used for deployment and testing:

- `scripts/deploy.js`: Deploy all contracts
- `scripts/interact.js`: Mint tokens, issue insurance, create an order
- `scripts/finalize.js`: Finalize the insurance pool with a final price
- `scripts/settle.js`: Settle insurance positions and claim compensation

## Usage Example

```javascript
// Issue insurance
await insurancePool.issueInsurance(
  ethers.parseUnits("20000", 18), // Strike price
  ethers.parseUnits("0.001", 18), // Amount
  recipient1, // Collateral token recipient
  recipient2  // Claim token recipient
);

// Create a sell order for claim tokens
await orderbook.createClaimTokenOrder(
  ethers.parseUnits("20000", 18), // Strike price
  ethers.parseUnits("0.001", 18), // Amount
  ethers.parseUnits("100", 18)    // Price per token
);

// Fill an order
await orderbook.fillOrder(
  1, // Order ID
  ethers.parseUnits("0.001", 18) // Amount to fill
);

// Finalize the insurance (owner only)
await insurancePool.finalize(
  ethers.parseUnits("18000", 18) // Final price
);

// Settle insurance positions
await insurancePool.settleInsurance([ethers.parseUnits("20000", 18)]);
```