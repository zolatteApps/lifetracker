const connectDB = require('../lib/mongodb.js');
const Feedback = require('../models/Feedback.js');
const { verifyToken } = require('../lib/auth-middleware.js');

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

  try {
    await connectDB();

    switch (req.method) {
      case 'POST':
        // Create new feedback
        const { category, message } = req.body;
        
        if (!category || !message) {
          return res.status(400).json({ error: 'Category and message are required' });
        }
        
        if (!['bug', 'feature', 'general'].includes(category)) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        
        if (message.length > 500) {
          return res.status(400).json({ error: 'Message must be less than 500 characters' });
        }
        
        const feedbackData = {
          userId: req.userId,
          category,
          message: message.trim()
        };
        
        const newFeedback = new Feedback(feedbackData);
        await newFeedback.save();
        
        return res.status(201).json({ 
          message: 'Feedback submitted successfully',
          feedback: newFeedback 
        });

      case 'GET':
        // Get user's feedback (optional, for future use)
        const userFeedback = await Feedback.find({ userId: req.userId })
          .sort({ createdAt: -1 })
          .limit(10);
        
        return res.status(200).json({ feedback: userFeedback });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = verifyToken(handler);