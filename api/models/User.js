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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);