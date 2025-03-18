// Test script for the faucet endpoint
const http = require('http');

const PORT = 3001;
const TEST_ADDRESS = '0x290Aaa70B1cA03ED1362cf20b1f4dB69bFB57919'; // Test address to receive the tokens

// Helper function for API requests with body
const apiRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Test the faucet endpoint
const testFaucet = async () => {
  try {
    console.log('Testing faucet endpoint...\n');
    
    // Test with valid address
    console.log('==== Testing Faucet with Valid Address ====');
    const validResponse = await apiRequest('POST', '/api/transactions/faucet', {
      address: TEST_ADDRESS
    });
    console.log(`Status: ${validResponse.status}`);
    console.log('Response Data:');
    console.log(`- Success: ${validResponse.data.success ? 'Yes' : 'No'}`);
    console.log(`- Amount: ${validResponse.data.amount || 'N/A'}`);
    if (validResponse.data.transaction) {
      console.log(`- Transaction Hash: ${validResponse.data.transaction.hash}`);
      console.log(`- Block Number: ${validResponse.data.transaction.blockNumber}`);
    }
    console.log(`- Message: ${validResponse.data.message || 'N/A'}`);
    console.log('\n');
    
    // Test with invalid address
    console.log('==== Testing Faucet with Invalid Address ====');
    const invalidResponse = await apiRequest('POST', '/api/transactions/faucet', {
      address: 'not-an-address'
    });
    console.log(`Status: ${invalidResponse.status}`);
    console.log('Error Message:', invalidResponse.data.error || 'N/A');
    console.log('\n');
    
    // Test with missing address
    console.log('==== Testing Faucet with Missing Address ====');
    const missingResponse = await apiRequest('POST', '/api/transactions/faucet', {});
    console.log(`Status: ${missingResponse.status}`);
    console.log('Error Message:', missingResponse.data.error || 'N/A');
    
    console.log('\nFaucet testing completed!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
};

// Run the test
testFaucet();