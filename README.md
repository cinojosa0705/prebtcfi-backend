# Price Insurance Protocol

A decentralized protocol for issuing and trading price insurance.

## Overview

The Price Insurance Protocol allows users to hedge against price movements of a specific asset. The protocol issues two types of tokens for each strike price:

1. **Collateral Tokens**: Represent the right to claim the collateral if the final price is at or above the strike price.
2. **Claim Tokens**: Represent the right to claim compensation if the final price falls below the strike price.

## Project Structure

- `contracts/`: Smart contracts for the insurance protocol
  - `InsurancePool.sol`: Main contract for issuing and settling insurance
  - `InsuranceToken.sol`: Token contract representing insurance positions
  - `InsuranceOrderbook.sol`: Trading platform for insurance tokens
  - `MockToken.sol`: Test ERC20 token for collateral

- `test/`: Test files for contracts
- `scripts/`: Deployment scripts

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd prebtcfi
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```
   
4. Fill in your API keys and private key in the `.env` file

### Testing

Run tests to ensure everything is working correctly:

```
npm run test
```

### Local Development

1. Start a local Ethereum node:
   ```
   npm run node
   ```

2. In a separate terminal, deploy contracts to the local network:
   ```
   npm run deploy:local
   ```

## Contract Deployment

To deploy to a testnet (e.g., Sepolia), uncomment and update the relevant network configuration in `hardhat.config.js`, then run:

```
npx hardhat run scripts/deploy.js --network sepolia
```

## Example Usage Flow

1. **Issue Insurance**:
   - User deposits collateral into the InsurancePool
   - InsurancePool mints collateral tokens and claim tokens for the specified strike price
   
2. **Trade Tokens**:
   - Users can create sell orders on the InsuranceOrderbook
   - Others can fill these orders to buy insurance
   
3. **Settlement**:
   - After a predetermined event, the owner finalizes the insurance period with the final price
   - Token holders can claim their compensation based on the final price

## Documentation

For detailed documentation, see `DOCUMENTATION.md`.

## License

MIT