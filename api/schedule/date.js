const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');

async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { date } = req.query;
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    await connectDB();
    
    // verifyToken middleware adds userId to req
    const userId = req.userId;

    if (req.method === 'GET') {
      const schedule = await Schedule.findOne({ userId, date });
      
      if (!schedule) {
        return res.status(200).json({
          userId,
          date,
          blocks: [],
        });
      }
      
      return res.status(200).json(schedule);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyToken(handler);