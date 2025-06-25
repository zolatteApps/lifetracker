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

    // Prepare update object
    const updateData = {};
    let newProgress = goal.progress || 0;

    // Calculate new progress based on goal type
    if (goal.type === 'numeric' || goal.type === 'habit') {
      if (currentValue !== undefined) {
        updateData.currentValue = currentValue;
        // Calculate progress
        if (goal.targetValue && goal.targetValue > 0) {
          newProgress = Math.min(Math.round((currentValue / goal.targetValue) * 100), 100);
          updateData.progress = newProgress;
        }
      }
    } else if (goal.type === 'milestone') {
      if (progress !== undefined) {
        newProgress = Math.min(Math.max(progress, 0), 100);
        updateData.progress = newProgress;
      }
    }

    // Prepare progress history entry
    const progressEntry = {
      value: newProgress,
      date: new Date(),
    };

    // Mark as completed if progress reaches 100
    if (newProgress >= 100 && !goal.completed) {
      updateData.completed = true;
      updateData.completedAt = new Date();
    }

    // Use findByIdAndUpdate with proper operators for atomic update
    const updatedGoal = await Goal.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        $push: { 
          progressHistory: {
            $each: [progressEntry],
            $slice: -90  // Keep only last 90 entries
          }
        },
        $inc: { 'analytics.totalUpdates': 1 },
        $currentDate: { 'analytics.lastProgressUpdate': true }
      },
      { 
        new: true,  // Return the updated document
        runValidators: false  // Skip validation for this update
      }
    );

    if (!updatedGoal) {
      return res.status(404).json({ error: 'Goal not found after update' });
    }

    return res.status(200).json({ 
      message: 'Progress updated successfully',
      goal: updatedGoal 
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