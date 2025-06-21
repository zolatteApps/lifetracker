import connectDB from '../lib/mongodb';
import Schedule from '../models/Schedule';
import authMiddleware from '../lib/auth-middleware';

export default async function handler(req, res) {
  const { date } = req.query;
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    await connectDB();
    
    const authResult = await authMiddleware(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }
    
    const userId = authResult.userId;

    if (req.method === 'GET') {
      const schedule = await Schedule.findOne({ userId, date });
      
      if (!schedule) {
        return res.status(200).json({
          userId,
          date,
          blocks: [],
        });
      }
      
      return res.status(200).json(schedule);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}