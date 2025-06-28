const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import User model
    const User = require('../api/models/User.js');

    // New password for admin
    const newPassword = 'admin123'; // Change this to your desired password
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin user
    const result = await User.findOneAndUpdate(
      { email: 'admin@gmail.com' },
      { 
        password: hashedPassword,
        role: 'admin'
      },
      { 
        new: true,
        upsert: true // Create if doesn't exist
      }
    );

    if (result) {
      console.log('Admin password reset successfully!');
      console.log('Email: admin@gmail.com');
      console.log('Password:', newPassword);
      console.log('Role:', result.role);
    } else {
      console.log('Failed to reset admin password');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
resetAdminPassword();