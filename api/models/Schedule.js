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
  tags: [{
    type: String,
  }],
  endDate: {
    type: Date,
    required: false,
  },
  recurrenceRule: {
    type: Object,
    required: false,
  },
  recurrenceId: {
    type: String,
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