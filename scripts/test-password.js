const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../api/models/User.js');
    
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (admin) {
      console.log('Testing passwords...');
      
      // Test various passwords
      const passwords = ['admin123', 'password', '123456', 'admin'];
      
      for (const pwd of passwords) {
        const isValid = await bcrypt.compare(pwd, admin.password);
        console.log(`Password "${pwd}": ${isValid ? 'VALID' : 'INVALID'}`);
      }
      
      // Generate new hash for admin123
      console.log('\nGenerating new hash for admin123...');
      const newHash = await bcrypt.hash('admin123', 10);
      console.log('New hash:', newHash);
      
      // Update the password
      admin.password = newHash;
      await admin.save();
      console.log('Password updated!');
      
      // Test again
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log(`Password "admin123" after update: ${isValid ? 'VALID' : 'INVALID'}`);
      
    } else {
      console.log('Admin user NOT found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();