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

    // Update progress directly on the document
    if (goal.type === 'numeric' || goal.type === 'habit') {
      if (currentValue !== undefined) {
        goal.currentValue = currentValue;
        // Calculate progress
        if (goal.targetValue && goal.targetValue > 0) {
          goal.progress = Math.min(Math.round((currentValue / goal.targetValue) * 100), 100);
        }
      }
    } else if (goal.type === 'milestone') {
      if (progress !== undefined) {
        goal.progress = Math.min(Math.max(progress, 0), 100);
      }
    }

    // Initialize fields if they don't exist
    if (!goal.progressHistory) goal.progressHistory = [];
    if (!goal.analytics) goal.analytics = {};

    // Add to progress history
    goal.progressHistory.push({
      value: goal.progress || 0,
      date: new Date(),
    });

    // Keep only last 90 entries
    if (goal.progressHistory.length > 90) {
      goal.progressHistory = goal.progressHistory.slice(-90);
    }

    // Update analytics
    goal.analytics.lastProgressUpdate = new Date();
    goal.analytics.totalUpdates = (goal.analytics.totalUpdates || 0) + 1;

    // Mark as completed if progress reaches 100
    if (goal.progress >= 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    }

    // Use markModified to ensure Mongoose knows about the changes
    goal.markModified('progressHistory');
    goal.markModified('analytics');

    // Try to save with error handling
    try {
      await goal.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Save error:', saveError);
      // If save fails, try direct update
      try {
        await Goal.updateOne(
          { _id: id },
          {
            $set: {
              currentValue: goal.currentValue,
              progress: goal.progress,
              completed: goal.completed,
              completedAt: goal.completedAt,
              progressHistory: goal.progressHistory,
              analytics: goal.analytics
            }
          }
        );
        // Fetch updated goal
        goal = await Goal.findById(id);
      } catch (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update goal', 
          details: updateError.message 
        });
      }
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