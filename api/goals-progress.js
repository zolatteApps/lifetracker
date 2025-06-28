const connectDB = require('./lib/mongodb.js');
const Goal = require('./models/Goal.js');
const { verifyToken } = require('./lib/auth-middleware.js');

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get goalId from query parameter instead of path
  const { goalId } = req.query;

  if (!goalId) {
    return res.status(400).json({ error: 'Goal ID is required' });
  }

  try {
    await connectDB();

    console.log('Progress update request for goal:', goalId);
    console.log('User ID:', req.userId);
    console.log('Request body:', req.body);

    // Find goal and verify ownership
    const goal = await Goal.findOne({ _id: goalId, userId: req.userId });
    if (!goal) {
      console.log('Goal not found for ID:', goalId, 'and userId:', req.userId);
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Update based on goal type
    let updateData = {};
    if (goal.type === 'milestone') {
      updateData.progress = req.body.progress || 0;
    } else if (goal.type === 'numeric') {
      updateData.currentValue = req.body.currentValue || 0;
      // Calculate progress percentage
      if (goal.targetValue && goal.targetValue > 0) {
        updateData.progress = Math.min(100, Math.round((updateData.currentValue / goal.targetValue) * 100));
      }
    } else if (goal.type === 'habit') {
      updateData.progress = req.body.progress || 0;
    }

    // Check if goal should be marked as completed
    if (updateData.progress >= 100) {
      updateData.completed = true;
    }

    // Update the goal
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('Goal updated successfully:', updatedGoal._id);

    return res.status(200).json({ 
      message: 'Progress updated successfully',
      goal: updatedGoal 
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
};

module.exports = verifyToken(handler);