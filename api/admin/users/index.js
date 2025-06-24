const connectDB = require('../../lib/mongodb.js');
const User = require('../../models/User.js');
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
      // Get query parameters
      const { page = 1, limit = 20, search = '', role = '' } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) {
        query.role = role;
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      res.status(200).json({
        users,
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
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};