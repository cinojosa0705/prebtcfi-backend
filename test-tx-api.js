// Test script for transaction API endpoints
const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

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

// Test transaction endpoints
const testTransactionEndpoints = async () => {
  try {
    console.log('Testing Transaction API endpoints...\n');
    
    // Test address to use in requests
    const testAddress = '0x290Aaa70B1cA03ED1362cf20b1f4dB69bFB57919';
    
    // Test issue insurance endpoint
    console.log('==== Testing Issue Insurance Endpoint ====');
    const issueInsuranceResponse = await apiRequest('POST', '/api/transactions/issue-insurance', {
      strikePrice: '20000',
      amount: '0.001',
      collateralTokenRecipient: testAddress,
      claimTokenRecipient: testAddress,
    });
    console.log(`Status: ${issueInsuranceResponse.status}`);
    console.log('Response Data Structure:');
    if (issueInsuranceResponse.data.preparatory) {
      console.log('- Has preparatory transactions:', issueInsuranceResponse.data.preparatory.length);
    }
    if (issueInsuranceResponse.data.transaction) {
      console.log('- Has main transaction');
      console.log('- Transaction To:', issueInsuranceResponse.data.transaction.to);
      console.log('- Has Data:', issueInsuranceResponse.data.transaction.data ? 'Yes' : 'No');
    }
    console.log('\n');
    
    // Test create claim token order endpoint
    console.log('==== Testing Create Claim Token Order Endpoint ====');
    const createClaimTokenOrderResponse = await apiRequest('POST', '/api/transactions/create-claim-token-order', {
      strikePrice: '20000',
      amount: '0.001',
      price: '100',
    });
    console.log(`Status: ${createClaimTokenOrderResponse.status}`);
    console.log('Response Data Structure:');
    if (createClaimTokenOrderResponse.data.preparatory) {
      console.log('- Has preparatory transactions:', createClaimTokenOrderResponse.data.preparatory.length);
    }
    if (createClaimTokenOrderResponse.data.transaction) {
      console.log('- Has main transaction');
      console.log('- Transaction To:', createClaimTokenOrderResponse.data.transaction.to);
      console.log('- Has Data:', createClaimTokenOrderResponse.data.transaction.data ? 'Yes' : 'No');
    }
    console.log('\n');
    
    // Test fill order endpoint
    console.log('==== Testing Fill Order Endpoint ====');
    const fillOrderResponse = await apiRequest('POST', '/api/transactions/fill-order', {
      orderId: 1,
      amount: '0.001',
    });
    console.log(`Status: ${fillOrderResponse.status}`);
    console.log('Response:', fillOrderResponse.data);
    console.log('\n');
    
    // Test deposit collateral endpoint
    console.log('==== Testing Deposit Collateral Endpoint ====');
    const depositCollateralResponse = await apiRequest('POST', '/api/transactions/deposit-collateral', {
      amount: '1000',
    });
    console.log(`Status: ${depositCollateralResponse.status}`);
    console.log('Response Data Structure:');
    if (depositCollateralResponse.data.preparatory) {
      console.log('- Has preparatory transactions:', depositCollateralResponse.data.preparatory.length);
    }
    if (depositCollateralResponse.data.transaction) {
      console.log('- Has main transaction');
      console.log('- Transaction To:', depositCollateralResponse.data.transaction.to);
      console.log('- Has Data:', depositCollateralResponse.data.transaction.data ? 'Yes' : 'No');
    }
    console.log('\n');
    
    // Test settle insurance endpoint
    console.log('==== Testing Settle Insurance Endpoint ====');
    const settleInsuranceResponse = await apiRequest('POST', '/api/transactions/settle-insurance', {
      strikePrices: ['20000'],
    });
    console.log(`Status: ${settleInsuranceResponse.status}`);
    console.log('Response Data Structure:');
    if (settleInsuranceResponse.data.transaction) {
      console.log('- Has main transaction');
      console.log('- Transaction To:', settleInsuranceResponse.data.transaction.to);
      console.log('- Has Data:', settleInsuranceResponse.data.transaction.data ? 'Yes' : 'No');
    }
    console.log('\n');
    
    console.log('Transaction API testing completed!');
  } catch (error) {
    console.error('Error during API testing:', error);
  }
};

// Run the tests
testTransactionEndpoints();