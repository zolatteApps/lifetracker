const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['physical', 'mental', 'financial', 'social'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['milestone', 'numeric', 'habit'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  targetValue: {
    type: Number,
    required: function() {
      return this.type === 'numeric' || this.type === 'habit';
    },
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: '',
  },
  dueDate: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update progress automatically for numeric and habit goals
goalSchema.pre('save', function(next) {
  if (this.type === 'numeric' || this.type === 'habit') {
    if (this.targetValue && this.targetValue > 0) {
      this.progress = Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100);
    }
  }
  
  // Mark as completed if progress reaches 100
  if (this.progress >= 100 && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();
  }
  
  this.updatedAt = new Date();
  next();
});

// Add index for efficient queries
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('Goal', goalSchema);