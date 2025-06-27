const connectDB = require('../lib/mongodb');
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../lib/auth-middleware');

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
  try {
    await connectDB();
    
    // verifyToken middleware adds userId to req
    const userId = req.userId;

    if (req.method === 'POST') {
      const { date, blocks } = req.body;
      
      if (!date || !blocks) {
        return res.status(400).json({ error: 'Date and blocks are required' });
      }
      
      // Validate blocks structure
      for (const block of blocks) {
        if (!block.id || !block.title || !block.category || !block.startTime || !block.endTime) {
          console.error('Invalid block structure:', block);
          return res.status(400).json({ 
            error: 'Invalid block structure. Required fields: id, title, category, startTime, endTime',
            invalidBlock: block 
          });
        }
      }
      
      const schedule = await Schedule.findOneAndUpdate(
        { userId, date },
        { userId, date, blocks },
        { new: true, upsert: true }
      );
      
      return res.status(200).json(schedule);
    }
    
    if (req.method === 'PUT') {
      const { scheduleId, blockId, updates } = req.body;
      
      if (!scheduleId || !blockId || !updates) {
        return res.status(400).json({ error: 'scheduleId, blockId and updates are required' });
      }
      
      const schedule = await Schedule.findOne({ _id: scheduleId, userId });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      const blockIndex = schedule.blocks.findIndex(block => block.id === blockId);
      
      if (blockIndex === -1) {
        return res.status(404).json({ error: 'Block not found' });
      }
      
      schedule.blocks[blockIndex] = { ...schedule.blocks[blockIndex].toObject(), ...updates };
      await schedule.save();
      
      return res.status(200).json(schedule);
    }
    
    if (req.method === 'DELETE') {
      const { scheduleId, blockId, deleteSeries = false, deleteAllOccurrences = false } = req.body;
      
      console.log('DELETE request:', { scheduleId, blockId, deleteSeries, deleteAllOccurrences });
      
      if (!scheduleId || !blockId) {
        return res.status(400).json({ error: 'scheduleId and blockId are required' });
      }
      
      const schedule = await Schedule.findOne({ _id: scheduleId, userId });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      const blockToDelete = schedule.blocks.find(block => block.id === blockId);
      
      if (!blockToDelete) {
        return res.status(404).json({ error: 'Block not found' });
      }
      
      // Handle recurring task series deletion
      if ((deleteSeries || deleteAllOccurrences) && blockToDelete.recurring && blockToDelete.recurrenceId) {
        console.log(`Deleting all occurrences of recurring task: ${blockToDelete.title} with recurrenceId: ${blockToDelete.recurrenceId}`);
        
        // Delete from current schedule
        schedule.blocks = schedule.blocks.filter(block => block.id !== blockId);
        await schedule.save();
        
        // Delete all future instances of this recurring task
        const allSchedules = await Schedule.find({
          userId,
          'blocks.recurrenceId': blockToDelete.recurrenceId,
          date: { $gte: schedule.date } // Only delete from current date onwards
        });
        
        console.log(`Found ${allSchedules.length} schedules with this recurring task`);
        
        let deletedCount = 0;
        
        for (const sched of allSchedules) {
          const originalLength = sched.blocks.length;
          sched.blocks = sched.blocks.filter(b => b.recurrenceId !== blockToDelete.recurrenceId);
          
          if (sched.blocks.length < originalLength) {
            await sched.save();
            deletedCount++;
          }
        }
        
        console.log(`Deleted recurring task from ${deletedCount} schedules`);
        
        // Also remove from our recurring task tracker
        // Note: This would need to be done on the client side
        
        return res.status(200).json({ 
          ...schedule.toObject(),
          message: `Deleted ${deletedCount} occurrences of recurring task`
        });
      } else {
        // Delete single instance only
        schedule.blocks = schedule.blocks.filter(block => block.id !== blockId);
        await schedule.save();
        
        return res.status(200).json(schedule);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      method: req.method
    });
    return res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

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

  // Apply auth middleware
  return verifyToken(handler)(req, res);
};