const connectDB = require('../../lib/mongodb.js');
const Goal = require('../../models/Goal.js');
const { verifyToken } = require('../../lib/auth-middleware.js');

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

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await connectDB();

    // Find goal and verify ownership
    const goal = await Goal.findOne({ _id: id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const { currentValue, progress } = req.body;

    // Update progress based on goal type
    if (goal.type === 'numeric' || goal.type === 'habit') {
      if (currentValue !== undefined) {
        goal.currentValue = currentValue;
      }
    } else if (goal.type === 'milestone') {
      if (progress !== undefined) {
        goal.progress = Math.min(Math.max(progress, 0), 100);
      }
    }

    // Save will automatically recalculate progress for numeric/habit goals
    try {
      await goal.save();
    } catch (saveError) {
      console.error('Goal save error:', saveError);
      console.error('Goal data:', JSON.stringify(goal, null, 2));
      return res.status(500).json({ 
        error: 'Failed to save goal', 
        details: saveError.message,
        validationErrors: saveError.errors 
      });
    }

    return res.status(200).json({ 
      message: 'Progress updated successfully',
      goal 
    });
  } catch (error) {
    console.error('Progress update error:', error);
    console.error('Request body:', req.body);
    console.error('Goal ID:', id);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

module.exports = verifyToken(handler);