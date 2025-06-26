const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');
const { applyRecurringTaskToSchedules, isDateInRecurrence } = require('../utils/recurrenceGenerator');

// Disable body parsing to handle it manually
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

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
    
    console.log('Recurring endpoint hit - Vercel function v2');
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { block, startDate, daysAhead = 90 } = req.body;
    const userId = req.userId;
    
    console.log('Extracted values:', { 
      hasBlock: !!block, 
      hasStartDate: !!startDate, 
      startDate, 
      startDateType: typeof startDate,
      startDateValue: startDate,
      userId
    });
    
    if (!block || !startDate) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Block and startDate are required' });
    }
    
    if (!block.recurring || !block.recurrenceRule) {
      return res.status(400).json({ error: 'Block must have recurring flag and recurrenceRule' });
    }
    
    // Validate date format
    console.log('Validating date format for:', startDate);
    if (!startDate || typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      console.log('Date validation failed:', { startDate, type: typeof startDate });
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Generate recurring instances
    const scheduleUpdates = applyRecurringTaskToSchedules(block, startDate, daysAhead);
    
    // Update or create schedules for each date
    const updatedSchedules = [];
    
    for (const { date, blocks } of scheduleUpdates) {
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
    
    return res.status(200).json({
      message: 'Recurring task instances created',
      updatedSchedules: updatedSchedules.length,
      details: updatedSchedules
    });
  } catch (error) {
    console.error('Create recurring tasks error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Helper to parse JSON body
const parseBody = async (req) => {
  return new Promise((resolve, reject) => {
    
    
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
};

module.exports = async (req, res) => {
  // Handle CORS first
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body for POST requests
  if (req.method === 'POST') {
    try {
      req.body = await parseBody(req);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }

  // Apply auth middleware
  return verifyToken(handler)(req, res);
};