const connectDB = require('../../lib/mongodb.js');
const User = require('../../models/User.js');
const Goal = require('../../models/Goal.js');
const adminAuth = require('../../middleware/adminAuth.js');

module.exports = async function handler(req, res) {
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

  // Apply admin authentication
  await new Promise((resolve, reject) => {
    adminAuth(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  }).catch(() => {
    // Response already sent by adminAuth
    return;
  });

  if (!req.user) return;

  const { userId } = req.query;

  try {
    await connectDB();

    if (req.method === 'GET') {
      // Get user details
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's goals
      const goals = await Goal.find({ userId: user._id });

      res.status(200).json({
        user,
        goals,
        stats: {
          totalGoals: goals.length,
          completedGoals: goals.filter(g => g.completed).length,
          goalsByCategory: {
            physical: goals.filter(g => g.category === 'physical').length,
            mental: goals.filter(g => g.category === 'mental').length,
            financial: goals.filter(g => g.category === 'financial').length,
            social: goals.filter(g => g.category === 'social').length,
          }
        }
      });
    } else if (req.method === 'PUT') {
      // Update user
      const { role, isPhoneVerified, isOnboardingCompleted } = req.body;

      const updateData = {};
      if (role !== undefined) updateData.role = role;
      if (isPhoneVerified !== undefined) updateData.isPhoneVerified = isPhoneVerified;
      if (isOnboardingCompleted !== undefined) updateData.isOnboardingCompleted = isOnboardingCompleted;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ user });
    } else if (req.method === 'DELETE') {
      // Prevent self-deletion
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Delete user and associated data
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete associated data
      await Promise.all([
        Goal.deleteMany({ userId: user._id }),
        User.findByIdAndDelete(userId)
      ]);

      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin user management error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};