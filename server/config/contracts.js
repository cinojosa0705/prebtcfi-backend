// Contract addresses on Core DAO testnet
const config = {
  coretestnet: {
    mockToken: '0xFB5091dcB40995074f6D57f6Ab511A4D1BF6c9E9',
    insurancePool: '0xFC7C9E6Fb9B7dfDB166e437b132B4742Dd4ED9Fd',
    insuranceOrderbook: '0xdAd7C6cA70CE9676B5DA5F1EaC17C42f75bf9CeB',
  },
  // Add mainnet or other network configurations as needed
};

// Default to coretestnet if environment doesn't specify
const network = process.env.BLOCKCHAIN_NETWORK || 'coretestnet';

// Export the addresses for the current network
module.exports = config[network];