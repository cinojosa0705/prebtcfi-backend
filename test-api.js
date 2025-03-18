// Simple test script for API
const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function for API requests
const apiRequest = (method, path) => {
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

    req.end();
  });
};

// Test endpoints
const testEndpoints = async () => {
  try {
    console.log('Testing API endpoints...\n');
    
    // Test root endpoint
    console.log('==== Testing Root Endpoint ====');
    const rootResponse = await apiRequest('GET', '/');
    console.log(`Status: ${rootResponse.status}`);
    console.log('Response:', rootResponse.data);
    console.log('\n');
    
    // Test contracts endpoint
    console.log('==== Testing Contracts Endpoint ====');
    const contractsResponse = await apiRequest('GET', '/api/queries/contracts');
    console.log(`Status: ${contractsResponse.status}`);
    console.log('Response:', contractsResponse.data);
    console.log('\n');
    
    // Test pool status endpoint
    console.log('==== Testing Pool Status Endpoint ====');
    const poolStatusResponse = await apiRequest('GET', '/api/queries/pool-status');
    console.log(`Status: ${poolStatusResponse.status}`);
    console.log('Response:', poolStatusResponse.data);
    console.log('\n');
    
    // Test order details endpoint
    console.log('==== Testing Order Details Endpoint ====');
    const orderResponse = await apiRequest('GET', '/api/queries/order/1');
    console.log(`Status: ${orderResponse.status}`);
    console.log('Response:', orderResponse.data);
    console.log('\n');
    
    // Test strike price info endpoint
    console.log('==== Testing Strike Price Info Endpoint ====');
    const strikePriceResponse = await apiRequest('GET', '/api/queries/strike/20000');
    console.log(`Status: ${strikePriceResponse.status}`);
    console.log('Response:', strikePriceResponse.data);
    console.log('\n');
    
    console.log('API testing completed!');
  } catch (error) {
    console.error('Error during API testing:', error);
  }
};

// Run the tests
testEndpoints();