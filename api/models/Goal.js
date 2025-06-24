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
  progressHistory: [{
    value: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  }],
  streak: {
    current: {
      type: Number,
      default: 0,
    },
    best: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
    },
  },
  analytics: {
    averageProgressPerDay: {
      type: Number,
      default: 0,
    },
    projectedCompletionDate: {
      type: Date,
    },
    lastProgressUpdate: {
      type: Date,
    },
    totalUpdates: {
      type: Number,
      default: 0,
    },
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
  
  // Track progress history
  if (this.isModified('progress') || this.isModified('currentValue')) {
    // Add to progress history
    this.progressHistory.push({
      value: this.progress,
      date: new Date(),
    });
    
    // Keep only last 90 days of history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    this.progressHistory = this.progressHistory.filter(entry => entry.date > ninetyDaysAgo);
    
    // Update analytics
    this.analytics.lastProgressUpdate = new Date();
    this.analytics.totalUpdates = (this.analytics.totalUpdates || 0) + 1;
    
    // Update streak for habit goals
    if (this.type === 'habit') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (this.streak.lastUpdated) {
        const lastUpdate = new Date(this.streak.lastUpdated);
        lastUpdate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          // Already updated today
        } else if (daysDiff === 1) {
          // Consecutive day
          this.streak.current += 1;
          this.streak.best = Math.max(this.streak.current, this.streak.best);
        } else {
          // Streak broken
          this.streak.current = 1;
        }
      } else {
        // First update
        this.streak.current = 1;
        this.streak.best = 1;
      }
      
      this.streak.lastUpdated = new Date();
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

// Add method to calculate analytics
goalSchema.methods.calculateAnalytics = function() {
  if (this.progressHistory.length > 1) {
    // Calculate average progress per day
    const sortedHistory = this.progressHistory.sort((a, b) => a.date - b.date);
    const firstUpdate = sortedHistory[0];
    const lastUpdate = sortedHistory[sortedHistory.length - 1];
    
    const daysDiff = Math.max(1, Math.floor((lastUpdate.date - firstUpdate.date) / (1000 * 60 * 60 * 24)));
    const progressDiff = lastUpdate.value - firstUpdate.value;
    
    this.analytics.averageProgressPerDay = progressDiff / daysDiff;
    
    // Calculate projected completion date
    if (this.analytics.averageProgressPerDay > 0 && this.progress < 100) {
      const remainingProgress = 100 - this.progress;
      const daysToComplete = Math.ceil(remainingProgress / this.analytics.averageProgressPerDay);
      
      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + daysToComplete);
      this.analytics.projectedCompletionDate = projectedDate;
    }
  }
  
  return this.analytics;
};

// Add index for efficient queries
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('Goal', goalSchema);