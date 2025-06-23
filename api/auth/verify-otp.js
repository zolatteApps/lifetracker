const jwt = require('jsonwebtoken');
const connectDB = require('../lib/mongodb.js');
const OTPVerification = require('../models/OTPVerification.js');
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }

  try {
    await connectDB();

    // Find OTP record
    const otpRecord = await OTPVerification.findOne({
      phoneNumber,
      verified: false
    });

    console.log('Verifying OTP:', otp, 'for phone:', phoneNumber);
    console.log('Found OTP record:', otpRecord ? { otp: otpRecord.otp, attempts: otpRecord.attempts } : 'None');

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= 3) {
        await otpRecord.deleteOne();
        return res.status(400).json({ 
          message: 'Too many failed attempts. Please request a new OTP.' 
        });
      }

      return res.status(400).json({ 
        message: 'Invalid OTP',
        attemptsRemaining: 3 - otpRecord.attempts 
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Create new user with phone number
      user = await User.create({
        phoneNumber,
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
        email: `${phoneNumber}@phone.local`, // Placeholder email
        isOnboardingCompleted: false
      });
    } else {
      // Update existing user
      user.isPhoneVerified = true;
      user.phoneVerifiedAt = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete the OTP record
    await otpRecord.deleteOne();

    res.status(200).json({
      message: 'Phone number verified successfully',
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
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP. Please try again.' 
    });
  }
};