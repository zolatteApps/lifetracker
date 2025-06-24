const connectDB = require('../../lib/mongodb.js');
const Feedback = require('../../models/Feedback.js');
const adminAuth = require('../../middleware/adminAuth.js');

module.exports = async function handler(req, res) {
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

  // Apply admin authentication
  await new Promise((resolve, reject) => {
    adminAuth(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  }).catch(() => {
    // Response already sent by adminAuth
    return;
  });

  if (!req.user) return;

  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === 'PUT') {
      const { status, adminNotes } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

      const feedback = await Feedback.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'email name');

      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      res.status(200).json({ feedback });
    } else if (req.method === 'DELETE') {
      const feedback = await Feedback.findByIdAndDelete(id);
      
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      res.status(200).json({ message: 'Feedback deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin feedback management error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};