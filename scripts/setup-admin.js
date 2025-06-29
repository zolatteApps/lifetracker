require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  let connection;
  
  try {
    // Validate environment
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to database:', connection.connection.name);

    // Load User model
    const User = require('../api/models/User.js');

    // Admin credentials
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';
    
    console.log('\n🔍 Checking for existing admin user...');
    
    // Find existing admin
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser._id);
      console.log('📧 Email:', adminUser.email);
      console.log('🛡️  Role:', adminUser.role);
      
      // Update password with proper hashing
      console.log('\n🔐 Resetting admin password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      adminUser.password = hashedPassword;
      adminUser.role = 'admin'; // Ensure role is set
      adminUser.isPhoneVerified = true; // Ensure verified
      adminUser.isOnboardingCompleted = true; // Ensure onboarding completed
      
      // Clear any password reset tokens
      adminUser.resetPasswordToken = undefined;
      adminUser.resetPasswordExpiry = undefined;
      
      await adminUser.save();
      console.log('✅ Password updated successfully');
      
      // Verify the password works
      console.log('\n🔍 Verifying password...');
      const isValid = await bcrypt.compare(adminPassword, adminUser.password);
      console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');
      
    } else {
      console.log('⚠️  No admin user found, creating new admin...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create new admin
      adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        isPhoneVerified: true,
        isOnboardingCompleted: true,
        phoneNumber: '+1234567890',
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }
    
    // Test login simulation
    console.log('\n🧪 Testing login simulation...');
    const testUser = await User.findOne({ email: adminEmail });
    const loginTest = await bcrypt.compare(adminPassword, testUser.password);
    console.log('✅ Login test:', loginTest ? 'PASSED' : 'FAILED');
    
    console.log('\n✨ Admin setup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check for environment issues
    console.log('\n🔍 Environment Check:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set (using default)');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      console.log('\n⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env for production!');
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run the setup
setupAdmin().catch(console.error);