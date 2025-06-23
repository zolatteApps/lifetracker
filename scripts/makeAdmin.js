const mongoose = require('mongoose');
const User = require('../api/models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesyncc';

async function makeUserAdmin(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    user.role = 'admin';
    await user.save();

    console.log(`Successfully made ${email} an admin`);
    console.log('User details:', {
      email: user.email,
      name: user.name,
      role: user.role
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node makeAdmin.js <email>');
  console.log('Example: node makeAdmin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(email);