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

    // Prepare update data
    const updateData = {};
    
    if (goal.type === 'numeric' || goal.type === 'habit') {
      if (currentValue !== undefined) {
        updateData.currentValue = currentValue;
        // Calculate progress
        if (goal.targetValue && goal.targetValue > 0) {
          updateData.progress = Math.min(Math.round((currentValue / goal.targetValue) * 100), 100);
        }
      }
    } else if (goal.type === 'milestone') {
      if (progress !== undefined) {
        updateData.progress = Math.min(Math.max(progress, 0), 100);
      }
    }

    // Add to progress history
    const progressEntry = {
      value: updateData.progress || goal.progress || 0,
      date: new Date(),
    };

    // Update goal using findByIdAndUpdate to avoid pre-save hook issues
    try {
      const updatedGoal = await Goal.findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateData,
            'analytics.lastProgressUpdate': new Date(),
          },
          $push: { 
            progressHistory: {
              $each: [progressEntry],
              $slice: -90  // Keep only last 90 entries
            }
          },
          $inc: { 'analytics.totalUpdates': 1 },
        },
        { new: true, runValidators: true }
      );

      if (!updatedGoal) {
        return res.status(404).json({ error: 'Goal not found after update' });
      }

      goal = updatedGoal;
    } catch (updateError) {
      console.error('Goal update error:', updateError);
      console.error('Update data:', updateData);
      return res.status(500).json({ 
        error: 'Failed to update goal', 
        details: updateError.message,
        validationErrors: updateError.errors 
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