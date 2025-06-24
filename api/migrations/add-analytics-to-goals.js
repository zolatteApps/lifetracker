const mongoose = require('mongoose');
const Goal = require('../models/Goal');
require('dotenv').config();

async function migrateGoals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesyncc', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all goals that don't have the new fields
    const goals = await Goal.find({
      $or: [
        { progressHistory: { $exists: false } },
        { streak: { $exists: false } },
        { analytics: { $exists: false } }
      ]
    });

    console.log(`Found ${goals.length} goals to migrate`);

    // Update each goal
    for (const goal of goals) {
      const updateData = {};

      // Initialize progress history with current progress
      if (!goal.progressHistory) {
        updateData.progressHistory = [{
          value: goal.progress || 0,
          date: goal.updatedAt || new Date(),
          note: 'Initial progress'
        }];
      }

      // Initialize streak data
      if (!goal.streak) {
        updateData.streak = {
          current: 0,
          best: 0,
          lastUpdated: null
        };
      }

      // Initialize analytics
      if (!goal.analytics) {
        updateData.analytics = {
          averageProgressPerDay: 0,
          projectedCompletionDate: null,
          lastProgressUpdate: goal.updatedAt || new Date(),
          totalUpdates: 1
        };
      }

      // Update the goal
      await Goal.findByIdAndUpdate(goal._id, {
        $set: updateData
      });

      console.log(`Migrated goal: ${goal.title}`);
    }

    console.log('Migration completed successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateGoals();