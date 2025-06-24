const mongoose = require('mongoose');
const User = require('../api/models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesyncc';

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'email name role createdAt');
    
    console.log('\nAll users in database:');
    console.log('======================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    console.log(`Total users: ${users.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();