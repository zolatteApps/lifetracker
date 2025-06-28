const connectDB = require('../lib/mongodb.js');
const Goal = require('../models/Goal.js');
const User = require('../models/User.js');
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

  const { id } = req.query;

  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await User.findById(req.userId);
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Check if goal exists
    let goal;
    if (isAdmin) {
      // Admin can access any goal
      goal = await Goal.findById(id);
    } else {
      // Regular users can only access their own goals
      goal = await Goal.findOne({ _id: id, userId: req.userId });
    }
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    switch (req.method) {
      case 'GET':
        // Get single goal
        return res.status(200).json({ goal });

      case 'PUT':
        // Update goal
        const updates = req.body;
        delete updates._id;
        delete updates.userId;
        
        Object.assign(goal, updates);
        await goal.save();
        
        return res.status(200).json({ 
          message: 'Goal updated successfully',
          goal 
        });

      case 'DELETE':
        // Delete goal
        if (isAdmin) {
          // Admin can delete any goal
          await Goal.deleteOne({ _id: id });
        } else {
          // Regular users can only delete their own goals
          await Goal.deleteOne({ _id: id, userId: req.userId });
        }
        return res.status(200).json({ message: 'Goal deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Goal API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = verifyToken(handler);