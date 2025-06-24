const connectDB = require('../lib/mongodb.js');
const User = require('../models/User.js');
const Goal = require('../models/Goal.js');
const Feedback = require('../models/Feedback.js');
const jwt = require('jsonwebtoken');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database first
    await connectDB();

    // Admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Get statistics
    const [userStats, goalStats, feedbackStats] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedUsers: {
              $sum: { $cond: [{ $eq: ['$isPhoneVerified', true] }, 1, 0] }
            },
            completedOnboarding: {
              $sum: { $cond: [{ $eq: ['$isOnboardingCompleted', true] }, 1, 0] }
            },
            adminUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Goal statistics
      Goal.aggregate([
        {
          $group: {
            _id: null,
            totalGoals: { $sum: 1 },
            completedGoals: {
              $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
            },
            physicalGoals: {
              $sum: { $cond: [{ $eq: ['$category', 'physical'] }, 1, 0] }
            },
            mentalGoals: {
              $sum: { $cond: [{ $eq: ['$category', 'mental'] }, 1, 0] }
            },
            financialGoals: {
              $sum: { $cond: [{ $eq: ['$category', 'financial'] }, 1, 0] }
            },
            socialGoals: {
              $sum: { $cond: [{ $eq: ['$category', 'social'] }, 1, 0] }
            }
          }
        }
      ]),

      // Feedback statistics
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            pendingFeedback: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            reviewedFeedback: {
              $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
            },
            resolvedFeedback: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email name createdAt isOnboardingCompleted role');

    // Get recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'email name');

    res.status(200).json({
      stats: {
        users: userStats[0] || {
          totalUsers: 0,
          verifiedUsers: 0,
          completedOnboarding: 0,
          adminUsers: 0
        },
        goals: goalStats[0] || {
          totalGoals: 0,
          completedGoals: 0,
          physicalGoals: 0,
          mentalGoals: 0,
          financialGoals: 0,
          socialGoals: 0
        },
        feedback: feedbackStats[0] || {
          totalFeedback: 0,
          pendingFeedback: 0,
          reviewedFeedback: 0,
          resolvedFeedback: 0
        }
      },
      recentActivity: {
        users: recentUsers,
        feedback: recentFeedback
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    
    // More specific error responses
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};