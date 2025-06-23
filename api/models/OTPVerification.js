const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Document will be automatically deleted after 10 minutes
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
});

// Create compound index for phone and OTP lookup
otpVerificationSchema.index({ phoneNumber: 1, otp: 1 });

const OTPVerification = mongoose.models.OTPVerification || mongoose.model('OTPVerification', otpVerificationSchema);

module.exports = OTPVerification;