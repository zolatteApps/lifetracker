const mongoose = require('mongoose');
const connectDB = require('../lib/mongodb.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check database connection
    await connectDB();
    health.services.database = {
      status: 'connected',
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
    };
  } catch (error) {
    health.status = 'error';
    health.services.database = {
      status: 'error',
      error: error.message
    };
  }

  // Check environment variables
  health.services.environment = {
    JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
    MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing'
  };

  // Set appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;
  
  res.status(statusCode).json(health);
};