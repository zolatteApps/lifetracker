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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return empty analytics for now
  // TODO: Implement real analytics when needed
  return res.status(200).json({
    goalId: req.query.id,
    progressHistory: [],
    streakData: {
      currentStreak: 0,
      longestStreak: 0,
      totalUpdates: 0
    },
    completionProjection: null,
    averageProgressPerDay: 0,
    lastUpdated: null
  });
};

module.exports = verifyToken(handler);