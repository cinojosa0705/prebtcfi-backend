// Test script for the all-orders endpoint
const http = require('http');

const PORT = 3001;

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

// Test the all-orders endpoint
const testAllOrders = async () => {
  try {
    console.log('Testing all-orders endpoint...\n');
    
    console.log('==== Testing All Orders Endpoint ====');
    const response = await apiRequest('GET', '/api/queries/all-orders');
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`Total Orders: ${response.data.totalOrders}`);
      
      // Log information about orders by strike price
      console.log('\nOrders by Strike Price:');
      response.data.ordersByStrikePrice.forEach(group => {
        console.log(`\nStrike Price: $${group.strikePriceFormatted}`);
        console.log(`Claim Token Orders: ${group.claimTokenOrders.length}`);
        console.log(`Insurance Orders: ${group.insuranceOrders.length}`);
        
        // Print sample order if available
        if (group.claimTokenOrders.length > 0) {
          const sampleOrder = group.claimTokenOrders[0];
          console.log('\nSample Claim Token Order:');
          console.log(`  Order ID: ${sampleOrder.orderId}`);
          console.log(`  Maker: ${sampleOrder.maker}`);
          console.log(`  Amount: ${sampleOrder.amountFormatted}`);
          console.log(`  Price: ${sampleOrder.priceFormatted}`);
          console.log(`  Fillable: ${sampleOrder.isFillable}`);
        }
      });
    } else {
      console.log('Response:', response.data);
    }
    
    console.log('\nTesting completed!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
};

// Run the test
testAllOrders();