import { Goal, ScheduleBlock } from '../types';

export const generateSchedule = (goals: Goal[]): ScheduleBlock[] => {
  const schedule: ScheduleBlock[] = [];
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

  const categoryScheduleMap: { [key: string]: { slots: string[], activities: string[] } } = {
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
    }
  };

  goals.forEach(goal => {
    const categoryInfo = categoryScheduleMap[goal.category];
    if (!categoryInfo) return;

    const availableSlots = timeSlots.filter(slot => 
      categoryInfo.slots.includes(slot.type) && 
      !schedule.some(block => block.startTime === slot.start)
    );

    if (availableSlots.length > 0) {
      const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      const randomActivity = categoryInfo.activities[Math.floor(Math.random() * categoryInfo.activities.length)];

      schedule.push({
        id: `block-${blockId++}`,
        title: randomActivity,
        category: goal.category,
        startTime: randomSlot.start,
        endTime: randomSlot.end,
        completed: false
      });
    }
  });

  // Add some default blocks
  schedule.push({
    id: `block-${blockId++}`,
    title: 'Morning Routine',
    category: 'mental',
    startTime: '07:00',
    endTime: '08:00',
    completed: false
  });

  schedule.push({
    id: `block-${blockId++}`,
    title: 'Work Focus Time',
    category: 'financial',
    startTime: '09:00',
    endTime: '12:00',
    completed: false
  });

  schedule.push({
    id: `block-${blockId++}`,
    title: 'Lunch Break',
    category: 'social',
    startTime: '12:00',
    endTime: '13:00',
    completed: false
  });

  // Sort by start time
  return schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
};