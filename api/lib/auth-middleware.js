const jwt = require('jsonwebtoken');

const verifyToken = (handler) => async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No token provided in request');
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    return handler(req, res);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = { verifyToken };