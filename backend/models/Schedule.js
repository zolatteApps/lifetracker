const mongoose = require('mongoose');

const scheduleBlockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['physical', 'mental', 'financial', 'social', 'personal'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  goalId: {
    type: String,
    required: false,
  },
  recurring: {
    type: Boolean,
    default: false,
  },
  recurrenceRule: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: false,
    },
    interval: {
      type: Number,
      default: 1,
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6,
    }],
    endDate: Date,
    endOccurrences: Number,
    exceptions: [Date],
  },
  recurrenceId: {
    type: String,
    required: false,
  },
  originalDate: {
    type: Date,
    required: false,
  },
});

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  blocks: [scheduleBlockSchema],
}, {
  timestamps: true,
});

scheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);