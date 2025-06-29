const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function testLoginEndpoint() {
  console.log('Testing login endpoint at:', API_URL);
  console.log('\n=== Testing Multiple Login Attempts ===');
  
  const credentials = {
    email: 'admin@gmail.com',
    password: 'admin123'
  };
  
  // Test multiple rapid login attempts
  const attempts = 5;
  const results = [];
  
  for (let i = 0; i < attempts; i++) {
    console.log(`\nAttempt ${i + 1}/${attempts}:`);
    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      const endTime = Date.now();
      
      console.log('✓ Success');
      console.log('  Status:', response.status);
      console.log('  Response time:', endTime - startTime, 'ms');
      console.log('  Token received:', !!response.data.token);
      console.log('  User role:', response.data.user?.role);
      
      results.push({
        attempt: i + 1,
        success: true,
        responseTime: endTime - startTime,
        status: response.status
      });
      
    } catch (error) {
      console.log('✗ Failed');
      console.log('  Error:', error.response?.data?.error || error.message);
      console.log('  Status:', error.response?.status);
      
      results.push({
        attempt: i + 1,
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status
      });
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n=== Summary ===');
  const successCount = results.filter(r => r.success).length;
  console.log(`Success rate: ${successCount}/${attempts} (${(successCount/attempts*100).toFixed(1)}%)`);
  
  const failedAttempts = results.filter(r => !r.success);
  if (failedAttempts.length > 0) {
    console.log('\nFailed attempts:');
    failedAttempts.forEach(f => {
      console.log(`  Attempt ${f.attempt}: ${f.error} (Status: ${f.status})`);
    });
  }
  
  const avgResponseTime = results
    .filter(r => r.success && r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;
  
  if (avgResponseTime > 0) {
    console.log(`\nAverage response time: ${avgResponseTime.toFixed(0)}ms`);
  }
}

// Test with wrong password
async function testWrongPassword() {
  console.log('\n\n=== Testing with Wrong Password ===');
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@gmail.com',
      password: 'wrongpassword'
    });
    console.log('Unexpected success with wrong password!');
  } catch (error) {
    console.log('✓ Correctly rejected wrong password');
    console.log('  Error:', error.response?.data?.error);
    console.log('  Status:', error.response?.status);
  }
}

// Main execution
async function main() {
  try {
    await testLoginEndpoint();
    await testWrongPassword();
  } catch (error) {
    console.error('\nUnexpected error:', error.message);
  }
}

main();