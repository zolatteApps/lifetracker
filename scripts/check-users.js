const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../api/models/User.js');
    
    const users = await User.find({}).select('_id email phoneNumber role createdAt');
    
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phoneNumber || 'N/A'}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();