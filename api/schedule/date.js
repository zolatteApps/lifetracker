const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');

// Helper function to check if a date is within a recurrence pattern
function isDateInRecurrence(recurrenceRule, targetDate, startDate) {
  if (!recurrenceRule) return false;
  
  const target = new Date(targetDate);
  const start = new Date(startDate);
  
  // Check if target date is before start date
  if (target < start) return false;
  
  // Check end conditions
  if (recurrenceRule.endDate && target > new Date(recurrenceRule.endDate)) {
    return false;
  }
  
  const daysDiff = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  
  switch (recurrenceRule.type) {
    case 'daily':
      return daysDiff % (recurrenceRule.interval || 1) === 0;
      
    case 'weekly':
      if (daysDiff % (7 * (recurrenceRule.interval || 1)) !== 0) return false;
      if (recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
        return recurrenceRule.daysOfWeek.includes(target.getDay());
      }
      return true;
      
    case 'monthly':
      const monthsDiff = (target.getFullYear() - start.getFullYear()) * 12 + 
                        (target.getMonth() - start.getMonth());
      return monthsDiff % (recurrenceRule.interval || 1) === 0 && 
             target.getDate() === start.getDate();
      
    default:
      return false;
  }
}

async function handler(req, res) {
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

  const { date } = req.query;
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    await connectDB();
    
    // verifyToken middleware adds userId to req
    const userId = req.userId;

    if (req.method === 'GET') {
      const schedule = await Schedule.findOne({ userId, date });
      
      // Get all schedules with recurring tasks for this user
      const recurringSchedules = await Schedule.find({
        userId,
        'blocks.recurring': true
      });
      
      console.log(`Found ${recurringSchedules.length} schedules with recurring tasks for user ${userId}`);
      
      const blocks = schedule ? [...schedule.blocks] : [];
      const addedRecurrenceIds = new Set();
      
      // Check each recurring task to see if it should appear on this date
      recurringSchedules.forEach(recurringSchedule => {
        recurringSchedule.blocks.forEach(block => {
          if (block.recurring && block.recurrenceRule && !addedRecurrenceIds.has(block.recurrenceId)) {
            console.log(`Checking recurring task: ${block.title}, recurrenceId: ${block.recurrenceId}`);
            const originalDate = block.originalDate || recurringSchedule.date;
            
            if (isDateInRecurrence(block.recurrenceRule, new Date(date), new Date(originalDate))) {
              console.log(`Task ${block.title} should appear on ${date}`);
              // Check if this specific instance already exists (might be modified)
              const existingBlock = blocks.find(b => b.recurrenceId === block.recurrenceId);
              
              if (!existingBlock) {
                // Add the recurring instance WITH all recurring properties preserved
                const blockObj = block.toObject ? block.toObject() : block;
                blocks.push({
                  id: `${block.id}-${date}`,
                  title: blockObj.title,
                  category: blockObj.category,
                  startTime: blockObj.startTime,
                  endTime: blockObj.endTime,
                  completed: false,
                  goalId: blockObj.goalId,
                  // Explicitly set recurring properties
                  recurring: true,
                  recurrenceId: blockObj.recurrenceId,
                  recurrenceRule: blockObj.recurrenceRule,
                  originalDate: new Date(date)
                });
                addedRecurrenceIds.add(block.recurrenceId);
              }
            }
          }
        });
      });
      
      return res.status(200).json({
        _id: schedule?._id,
        userId,
        date,
        blocks: blocks.sort((a, b) => a.startTime.localeCompare(b.startTime))
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyToken(handler);