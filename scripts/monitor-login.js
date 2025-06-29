const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CHECK_INTERVAL = 60000; // Check every 60 seconds

async function checkLoginHealth() {
  const timestamp = new Date().toISOString();
  
  try {
    // Test login endpoint
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    }, {
      timeout: 10000
    });
    
    console.log(`[${timestamp}] ✓ Login successful - Response time: ${response.headers['x-response-time'] || 'N/A'}`);
    
  } catch (error) {
    console.error(`[${timestamp}] ✗ Login failed:`, error.response?.data?.error || error.message);
    
    // Check database connection directly
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`[${timestamp}] Database connection: OK`);
      console.log(`[${timestamp}] Connection state:`, mongoose.connection.readyState);
      
      const User = require('../api/models/User.js');
      const admin = await User.findOne({ email: 'admin@gmail.com' });
      console.log(`[${timestamp}] Admin user in DB:`, admin ? 'Found' : 'Not found');
      
      await mongoose.disconnect();
    } catch (dbError) {
      console.error(`[${timestamp}] Database error:`, dbError.message);
    }
  }
}

async function startMonitoring() {
  console.log('Starting login health monitor...');
  console.log(`Checking every ${CHECK_INTERVAL / 1000} seconds`);
  console.log('Press Ctrl+C to stop\n');
  
  // Initial check
  await checkLoginHealth();
  
  // Schedule periodic checks
  setInterval(checkLoginHealth, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping monitor...');
  process.exit(0);
});

startMonitoring();