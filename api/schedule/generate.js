import connectDB from '../lib/mongodb';
import Schedule from '../models/Schedule';
import authMiddleware from '../lib/auth-middleware';

const generateScheduleBlocks = (goals) => {
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

  const workSlots = timeSlots.filter(slot => slot.type === 'work' && !usedSlots.has(slot.start));
  if (workSlots.length >= 3) {
    blocks.push({
      id: `block-${blockId++}`,
      title: 'Work Focus Time',
      category: 'financial',
      startTime: workSlots[0].start,
      endTime: workSlots[2].end,
      completed: false
    });
  }

  return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const authResult = await authMiddleware(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }
    
    const userId = authResult.userId;
    const { date, goals } = req.body;
    
    if (!date || !goals) {
      return res.status(400).json({ error: 'Date and goals are required' });
    }
    
    const blocks = generateScheduleBlocks(goals);
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId, date },
      { userId, date, blocks },
      { new: true, upsert: true }
    );
    
    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Generate schedule error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}