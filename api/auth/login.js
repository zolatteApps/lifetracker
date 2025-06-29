const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('../lib/mongodb.js');
const User = require('../models/User.js');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection with retry
    let dbConnected = false;
    let retries = 3;
    while (!dbConnected && retries > 0) {
      try {
        await connectDB();
        dbConnected = true;
      } catch (dbError) {
        retries--;
        console.error(`Database connection failed (${3 - retries}/3):`, dbError.message);
        if (retries === 0) {
          throw dbError;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure admin@gmail.com always has admin role
    if (email === 'admin@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    if (jwtSecret === 'your-secret-key') {
      console.warn('WARNING: Using default JWT secret. Please set JWT_SECRET environment variable.');
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.isPhoneVerified,
        name: user.name,
        age: user.age,
        gender: user.gender,
        height: user.height,
        isOnboardingCompleted: user.isOnboardingCompleted,
        profileCompletedAt: user.profileCompletedAt,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}