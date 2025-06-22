const connectDB = require('../lib/mongodb.js');
const Goal = require('../models/Goal.js');
const { verifyToken } = require('../lib/auth-middleware.js');

const handler = async (req, res) => {
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

  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        // Get all goals for the user
        const { category, completed } = req.query;
        const filter = { userId: req.userId };
        
        if (category) {
          filter.category = category;
        }
        
        if (completed !== undefined) {
          filter.completed = completed === 'true';
        }
        
        const goals = await Goal.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ goals });

      case 'POST':
        // Create a new goal
        const goalData = {
          ...req.body,
          userId: req.userId,
        };
        
        const newGoal = new Goal(goalData);
        await newGoal.save();
        
        return res.status(201).json({ 
          message: 'Goal created successfully',
          goal: newGoal 
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Goals API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = verifyToken(handler);