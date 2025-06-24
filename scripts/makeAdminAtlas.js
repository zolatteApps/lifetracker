const mongoose = require('mongoose');
const User = require('../api/models/User');

// MongoDB Atlas connection - you'll need to update this with your connection string
const MONGODB_URI = 'mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/healthsyncc?retryWrites=true&w=majority';

async function makeUserAdmin(email) {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

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
  console.log('Usage: node makeAdminAtlas.js <email>');
  console.log('Example: node makeAdminAtlas.js user@example.com');
  process.exit(1);
}

makeUserAdmin(email);