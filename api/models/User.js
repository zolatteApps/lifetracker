const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.phoneNumber;
    },
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerifiedAt: {
    type: Date,
  },
  // Profile fields
  name: {
    type: String,
    trim: true,
  },
  age: {
    type: Number,
    min: 18,
    max: 120,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  height: {
    value: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm',
    },
  },
  isOnboardingCompleted: {
    type: Boolean,
    default: false,
  },
  profileCompletedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);