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

    console.log('=== PROGRESS UPDATE DEBUG START ===');
    console.log('Goal ID:', id);
    console.log('User ID:', req.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Find goal and verify ownership
    const goal = await Goal.findOne({ _id: id, userId: req.userId });
    if (!goal) {
      console.log('Goal not found for ID:', id, 'and userId:', req.userId);
      return res.status(404).json({ error: 'Goal not found' });
    }

    console.log('Found goal:', {
      id: goal._id,
      type: goal.type,
      progress: goal.progress,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      hasAnalytics: !!goal.analytics,
      hasProgressHistory: !!goal.progressHistory,
      analyticsStructure: goal.analytics ? Object.keys(goal.analytics) : 'none',
      progressHistoryLength: goal.progressHistory ? goal.progressHistory.length : 0
    });

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

    console.log('Calculated new progress:', newProgress);
    console.log('Update data so far:', updateData);

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

    // STEP 1: Try minimal update first
    console.log('Step 1: Trying minimal update with just progress...');
    try {
      const minimalUpdate = await Goal.findByIdAndUpdate(
        id,
        { $set: { progress: newProgress, currentValue: updateData.currentValue || goal.currentValue } },
        { new: true, runValidators: false }
      );
      console.log('Minimal update successful');
    } catch (minimalError) {
      console.error('Minimal update failed:', minimalError.message);
      throw minimalError;
    }

    // STEP 2: Try adding analytics update
    console.log('Step 2: Trying to update analytics...');
    try {
      // Initialize analytics if it doesn't exist
      if (!goal.analytics) {
        console.log('Initializing analytics object...');
        await Goal.findByIdAndUpdate(
          id,
          { $set: { analytics: { totalUpdates: 0, lastProgressUpdate: new Date() } } },
          { new: true }
        );
      }

      // Now update analytics
      const analyticsUpdate = await Goal.findByIdAndUpdate(
        id,
        { 
          $set: { 'analytics.lastProgressUpdate': new Date() },
          $inc: { 'analytics.totalUpdates': 1 }
        },
        { new: true, runValidators: false }
      );
      console.log('Analytics update successful');
    } catch (analyticsError) {
      console.error('Analytics update failed:', analyticsError.message);
      console.error('Full error:', analyticsError);
    }

    // STEP 3: Try adding progress history
    console.log('Step 3: Trying to update progress history...');
    try {
      // Initialize progressHistory if it doesn't exist
      if (!goal.progressHistory || !Array.isArray(goal.progressHistory)) {
        console.log('Initializing progressHistory array...');
        await Goal.findByIdAndUpdate(
          id,
          { $set: { progressHistory: [] } },
          { new: true }
        );
      }

      // Now update progress history
      const historyUpdate = await Goal.findByIdAndUpdate(
        id,
        { 
          $push: { 
            progressHistory: {
              $each: [progressEntry],
              $slice: -90
            }
          }
        },
        { new: true, runValidators: false }
      );
      console.log('Progress history update successful');
    } catch (historyError) {
      console.error('Progress history update failed:', historyError.message);
      console.error('Full error:', historyError);
    }

    // STEP 4: Get the final updated goal
    console.log('Step 4: Fetching final updated goal...');
    const updatedGoal = await Goal.findById(id);
    
    if (!updatedGoal) {
      console.error('Could not fetch updated goal');
      return res.status(404).json({ error: 'Goal not found after update' });
    }

    console.log('Final updated goal:', {
      id: updatedGoal._id,
      progress: updatedGoal.progress,
      currentValue: updatedGoal.currentValue,
      analyticsUpdated: updatedGoal.analytics?.lastProgressUpdate,
      historyLength: updatedGoal.progressHistory?.length
    });

    console.log('=== PROGRESS UPDATE DEBUG END ===');

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