const User = require('../models/User');
const { verifyToken } = require('../lib/auth-middleware');
const connectDB = require('../lib/mongodb');

const updateProfileHandler = async (req, res) => {
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const userId = req.userId;
    const { name, age, gender, height, isOnboardingCompleted, profileCompletedAt } = req.body;

    // Validate input
    if (age && (age < 18 || age > 120)) {
      return res.status(400).json({ error: 'Age must be between 18 and 120' });
    }

    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }

    if (height && (!height.value || !height.unit || !['cm', 'ft'].includes(height.unit))) {
      return res.status(400).json({ error: 'Invalid height format' });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = height;
    if (isOnboardingCompleted !== undefined) updateData.isOnboardingCompleted = isOnboardingCompleted;
    if (profileCompletedAt !== undefined) updateData.profileCompletedAt = new Date(profileCompletedAt);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        isPhoneVerified: updatedUser.isPhoneVerified,
        name: updatedUser.name,
        age: updatedUser.age,
        gender: updatedUser.gender,
        height: updatedUser.height,
        isOnboardingCompleted: updatedUser.isOnboardingCompleted,
        profileCompletedAt: updatedUser.profileCompletedAt,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = verifyToken(updateProfileHandler);