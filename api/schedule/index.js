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
      const { scheduleId, blockId } = req.body;
      
      if (!scheduleId || !blockId) {
        return res.status(400).json({ error: 'scheduleId and blockId are required' });
      }
      
      const schedule = await Schedule.findOne({ _id: scheduleId, userId });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      schedule.blocks = schedule.blocks.filter(block => block.id !== blockId);
      await schedule.save();
      
      return res.status(200).json(schedule);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyToken(handler);