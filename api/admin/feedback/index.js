const connectDB = require('../../lib/mongodb.js');
const Feedback = require('../../models/Feedback.js');
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

  try {
    await connectDB();

    if (req.method === 'GET') {
      const { status = '', category = '', page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (category) query.category = category;

      // Get feedback with pagination
      const [feedback, total] = await Promise.all([
        Feedback.find(query)
          .populate('userId', 'email name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Feedback.countDocuments(query)
      ]);

      res.status(200).json({
        feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};