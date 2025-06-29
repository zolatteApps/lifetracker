const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function debugLoginIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('../api/models/User.js');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!admin) {
      console.log('ERROR: Admin user not found!');
      return;
    }
    
    console.log('\n=== Admin User Details ===');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Has password field:', !!admin.password);
    console.log('Password hash length:', admin.password ? admin.password.length : 0);
    console.log('Password hash prefix:', admin.password ? admin.password.substring(0, 10) : 'N/A');
    console.log('Created at:', admin.createdAt);
    console.log('User ID:', admin._id);
    
    // Check password format
    if (admin.password) {
      if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
        console.log('✓ Password hash format is correct (bcrypt)');
      } else {
        console.log('✗ WARNING: Password hash format might be incorrect');
        console.log('  Full hash:', admin.password);
      }
    }
    
    // Test password comparison
    console.log('\n=== Password Testing ===');
    const testPassword = 'admin123';
    console.log('Testing with password:', testPassword);
    
    try {
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('Password comparison result:', isValid ? '✓ VALID' : '✗ INVALID');
      
      if (!isValid) {
        // Generate a new hash to compare
        console.log('\nGenerating fresh hash for comparison...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash would be:', newHash.substring(0, 20) + '...');
        
        // Compare hash lengths
        console.log('Current hash length:', admin.password.length);
        console.log('New hash length:', newHash.length);
      }
      
    } catch (compareError) {
      console.log('✗ ERROR during password comparison:', compareError.message);
    }
    
    // Check for duplicate users
    console.log('\n=== Checking for Duplicates ===');
    const duplicates = await User.find({ 
      email: { $regex: /^admin@gmail\.com$/i } 
    });
    console.log('Total users with admin@gmail.com (case-insensitive):', duplicates.length);
    
    if (duplicates.length > 1) {
      console.log('WARNING: Multiple admin users found!');
      duplicates.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
    // Check JWT configuration
    console.log('\n=== JWT Configuration ===');
    console.log('JWT_SECRET is:', process.env.JWT_SECRET ? 'DEFINED' : 'NOT DEFINED (using fallback "your-secret-key")');
    
    // Check MongoDB connection
    console.log('\n=== MongoDB Connection ===');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the debug script
debugLoginIssue();