const express = require('express');
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get schedule for a specific date
router.get('/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const schedule = await Schedule.findOne({ userId: req.userId, date });
    
    if (!schedule) {
      return res.status(200).json({
        userId: req.userId,
        date,
        blocks: [],
      });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update schedule
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, blocks } = req.body;
    
    if (!date || !blocks) {
      return res.status(400).json({ error: 'Date and blocks are required' });
    }
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId: req.userId, date },
      { userId: req.userId, date, blocks },
      { new: true, upsert: true }
    );
    
    res.json(schedule);
  } catch (error) {
    console.error('Create/update schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a specific block
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { scheduleId, blockId, updates } = req.body;
    
    if (!scheduleId || !blockId || !updates) {
      return res.status(400).json({ error: 'scheduleId, blockId and updates are required' });
    }
    
    const schedule = await Schedule.findOne({ _id: scheduleId, userId: req.userId });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const blockIndex = schedule.blocks.findIndex(block => block.id === blockId);
    
    if (blockIndex === -1) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    schedule.blocks[blockIndex] = { ...schedule.blocks[blockIndex].toObject(), ...updates };
    await schedule.save();
    
    res.json(schedule);
  } catch (error) {
    console.error('Update block error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a block
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { scheduleId, blockId } = req.body;
    
    if (!scheduleId || !blockId) {
      return res.status(400).json({ error: 'scheduleId and blockId are required' });
    }
    
    const schedule = await Schedule.findOne({ _id: scheduleId, userId: req.userId });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    schedule.blocks = schedule.blocks.filter(block => block.id !== blockId);
    await schedule.save();
    
    res.json(schedule);
  } catch (error) {
    console.error('Delete block error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate schedule from goals
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { date, goals } = req.body;
    
    if (!date || !goals) {
      return res.status(400).json({ error: 'Date and goals are required' });
    }
    
    const blocks = generateScheduleBlocks(goals);
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId: req.userId, date },
      { userId: req.userId, date, blocks },
      { new: true, upsert: true }
    );
    
    res.json(schedule);
  } catch (error) {
    console.error('Generate schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate schedule blocks
function generateScheduleBlocks(goals) {
  const blocks = [];
  let blockId = 0;

  const timeSlots = [
    { start: '07:00', end: '08:00', type: 'morning' },
    { start: '08:00', end: '09:00', type: 'morning' },
    { start: '09:00', end: '10:00', type: 'work' },
    { start: '10:00', end: '11:00', type: 'work' },
    { start: '11:00', end: '12:00', type: 'work' },
    { start: '12:00', end: '13:00', type: 'lunch' },
    { start: '13:00', end: '14:00', type: 'work' },
    { start: '14:00', end: '15:00', type: 'work' },
    { start: '15:00', end: '16:00', type: 'work' },
    { start: '16:00', end: '17:00', type: 'work' },
    { start: '17:00', end: '18:00', type: 'evening' },
    { start: '18:00', end: '19:00', type: 'evening' },
    { start: '19:00', end: '20:00', type: 'evening' },
    { start: '20:00', end: '21:00', type: 'evening' },
    { start: '21:00', end: '22:00', type: 'night' }
  ];

  const categoryScheduleMap = {
    physical: {
      slots: ['morning', 'evening'],
      activities: [
        'Morning Workout',
        'Evening Walk',
        'Yoga Session',
        'Gym Training',
        'Outdoor Activity'
      ]
    },
    mental: {
      slots: ['morning', 'lunch', 'night'],
      activities: [
        'Morning Meditation',
        'Mindfulness Break',
        'Journal Writing',
        'Reading Time',
        'Relaxation Exercise'
      ]
    },
    financial: {
      slots: ['work', 'evening'],
      activities: [
        'Budget Review',
        'Investment Research',
        'Expense Tracking',
        'Financial Planning',
        'Side Project Work'
      ]
    },
    social: {
      slots: ['lunch', 'evening', 'night'],
      activities: [
        'Team Lunch',
        'Family Time',
        'Friend Catch-up',
        'Community Event',
        'Phone Call with Loved Ones'
      ]
    },
    personal: {
      slots: ['morning', 'evening', 'night'],
      activities: [
        'Personal Development',
        'Hobby Time',
        'Creative Work',
        'Self-Care',
        'Learning Session'
      ]
    }
  };

  const usedSlots = new Set();

  goals.forEach(goal => {
    const categoryInfo = categoryScheduleMap[goal.category];
    if (!categoryInfo) return;

    const availableSlots = timeSlots.filter(slot => 
      categoryInfo.slots.includes(slot.type) && 
      !usedSlots.has(slot.start)
    );

    if (availableSlots.length > 0) {
      const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      const randomActivity = categoryInfo.activities[Math.floor(Math.random() * categoryInfo.activities.length)];

      blocks.push({
        id: `block-${blockId++}`,
        title: randomActivity,
        category: goal.category,
        startTime: randomSlot.start,
        endTime: randomSlot.end,
        completed: false,
        goalId: goal.id
      });
      
      usedSlots.add(randomSlot.start);
    }
  });

  // Add default blocks if not already used
  if (!usedSlots.has('07:00')) {
    blocks.push({
      id: `block-${blockId++}`,
      title: 'Morning Routine',
      category: 'mental',
      startTime: '07:00',
      endTime: '08:00',
      completed: false
    });
  }

  if (!usedSlots.has('12:00')) {
    blocks.push({
      id: `block-${blockId++}`,
      title: 'Lunch Break',
      category: 'social',
      startTime: '12:00',
      endTime: '13:00',
      completed: false
    });
  }

  return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

module.exports = router;