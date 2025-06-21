import mongoose from 'mongoose';

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

export default mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);