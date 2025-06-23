const twilio = require('twilio');
const connectDB = require('../lib/mongodb.js');
const OTPVerification = require('../models/OTPVerification.js');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

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

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  try {
    await connectDB();

    // Check for rate limiting - max 3 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTPVerification.countDocuments({
      phoneNumber,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({ 
        message: 'Too many OTP requests. Please try again later.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await OTPVerification.create({
      phoneNumber,
      otp
    });

    // Send OTP via SMS
    await client.messages.create({
      body: `Your LifeSync verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    res.status(200).json({ 
      message: 'OTP sent successfully',
      phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') // Mask phone number
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    
    if (error.code === 21608) {
      return res.status(400).json({ 
        message: 'This phone number is not verified with Twilio. Please use a verified number.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
};