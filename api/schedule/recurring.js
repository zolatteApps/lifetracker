const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');
const { applyRecurringTaskToSchedules, isDateInRecurrence } = require('../utils/recurrenceGenerator');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    console.log('Recurring endpoint hit - Vercel function v3');
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { block, startDate, daysAhead = 90 } = req.body;
    console.log('Extracted data:', { 
      hasBlock: !!block, 
      hasStartDate: !!startDate, 
      blockData: block,
      startDate
    });
    
    const userId = req.userId;
    
    if (!block || !startDate) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Block and startDate are required' });
    }
    
    if (!block.recurring || !block.recurrenceRule) {
      console.log('Missing recurring flag or recurrenceRule');
      return res.status(400).json({ error: 'Block must have recurring flag and recurrenceRule' });
    }
    
    // Validate date format
    console.log('Validating date format for:', startDate);
    if (!startDate || typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      console.log('Date validation failed:', { startDate, type: typeof startDate });
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Generate recurring instances
    console.log('Generating recurring instances...');
    const scheduleUpdates = applyRecurringTaskToSchedules(block, startDate, daysAhead);
    console.log('Schedule updates generated:', scheduleUpdates.length, 'dates');
    
    // Update or create schedules for each date
    const updatedSchedules = [];
    
    for (const { date, blocks } of scheduleUpdates) {
      console.log('Processing date:', date);
      const existingSchedule = await Schedule.findOne({ userId, date });
      
      if (existingSchedule) {
        // Add new blocks to existing schedule, avoiding duplicates
        const existingRecurrenceIds = new Set(
          existingSchedule.blocks
            .filter(b => b.recurrenceId)
            .map(b => b.recurrenceId)
        );
        
        const newBlocks = blocks.filter(b => !existingRecurrenceIds.has(b.recurrenceId));
        
        if (newBlocks.length > 0) {
          existingSchedule.blocks.push(...newBlocks);
          await existingSchedule.save();
          updatedSchedules.push({ date, added: newBlocks.length });
        }
      } else {
        // Create new schedule
        const newSchedule = await Schedule.create({
          userId,
          date,
          blocks
        });
        updatedSchedules.push({ date, added: blocks.length });
      }
    }
    
    console.log('Recurring task created successfully');
    return res.status(200).json({ 
      message: 'Recurring task created successfully',
      schedulesUpdated: updatedSchedules.length,
      details: updatedSchedules
    });
    
  } catch (error) {
    console.error('Recurring task error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyToken(handler);