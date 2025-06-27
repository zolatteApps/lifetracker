const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');

async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    const userId = req.userId;

    if (req.method === 'GET') {
      // Get ALL schedules for this user
      const allSchedules = await Schedule.find({ userId });
      
      const recurringTasks = [];
      
      allSchedules.forEach(schedule => {
        schedule.blocks.forEach(block => {
          if (block.recurring || block.recurrenceId || block.recurrenceRule) {
            recurringTasks.push({
              date: schedule.date,
              title: block.title,
              recurring: block.recurring,
              recurrenceId: block.recurrenceId,
              hasRecurrenceRule: !!block.recurrenceRule,
              recurrenceRuleType: block.recurrenceRule?.type
            });
          }
        });
      });
      
      return res.status(200).json({
        totalSchedules: allSchedules.length,
        recurringTasksFound: recurringTasks.length,
        recurringTasks: recurringTasks
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyToken(handler);