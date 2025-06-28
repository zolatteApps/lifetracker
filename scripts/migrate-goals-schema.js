#!/usr/bin/env node

/**
 * Migration script to update existing goals to the new schema
 * This adds the new fields and removes deprecated ones
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Goal = require('../api/models/Goal.js');

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesyncc';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all existing goals
    const goals = await Goal.find({});
    console.log(`Found ${goals.length} goals to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const goal of goals) {
      try {
        const updates = {};
        
        // Add new fields if they don't exist
        if (!goal.type) {
          // Infer type based on existing data
          if (goal.frequency) {
            updates.type = 'habit'; // Goals with frequency are likely habits
          } else {
            updates.type = 'milestone'; // Default to milestone
          }
        }
        
        if (!goal.priority) {
          updates.priority = 'medium';
        }
        
        if (goal.completed === undefined) {
          // If progress is 100, mark as completed
          updates.completed = goal.progress >= 100;
        }
        
        // Remove deprecated fields
        if (goal.frequency !== undefined) {
          updates.$unset = { frequency: 1 };
        }
        if (goal.status !== undefined) {
          if (!updates.$unset) updates.$unset = {};
          updates.$unset.status = 1;
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0 || updates.$unset) {
          await Goal.updateOne(
            { _id: goal._id },
            updates
          );
          updatedCount++;
          console.log(`Updated goal: ${goal.title} (${goal._id})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error updating goal ${goal._id}:`, error.message);
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total goals: ${goals.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Unchanged: ${goals.length - updatedCount - errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();