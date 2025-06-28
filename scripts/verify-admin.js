const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../api/models/User.js');
    
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (admin) {
      console.log('Admin user found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Has password:', !!admin.password);
      console.log('Password hash:', admin.password);
      console.log('Created at:', admin.createdAt);
    } else {
      console.log('Admin user NOT found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdmin();