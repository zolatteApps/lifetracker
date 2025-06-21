import connectDB from '../lib/mongodb';
import Schedule from '../models/Schedule';
import authMiddleware from '../lib/auth-middleware';

export default async function handler(req, res) {
  try {
    await connectDB();
    
    const authResult = await authMiddleware(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }
    
    const userId = authResult.userId;

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