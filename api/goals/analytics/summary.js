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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, skip authentication to test if that's the issue
    // TODO: Re-enable authentication once confirmed working
    
    // Return empty summary analytics for now
    // TODO: Implement real analytics when needed
    return res.status(200).json({
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      categoryBreakdown: {
        physical: { total: 0, active: 0, completed: 0 },
        mental: { total: 0, active: 0, completed: 0 },
        financial: { total: 0, active: 0, completed: 0 },
        social: { total: 0, active: 0, completed: 0 }
      },
      overallProgress: 0,
      streakData: {
        totalActiveStreaks: 0,
        longestStreak: 0
      },
      weeklyMomentum: {
        updateCount: 0,
        updateChange: 0
      },
      completionRate: 0,
      projectedCompletions: []
    });
  } catch (error) {
    console.error('Analytics summary endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = handler;