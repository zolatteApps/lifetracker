import Goal from '../../../../api/models/Goal';
import connectDB from '../../../../api/config/database';
import { verifyToken } from '../../../../api/middleware/auth';

async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  await connectDB();

  switch (method) {
    case 'GET':
      try {
        const goal = await Goal.findOne({
          _id: id,
          userId: req.userId,
        });

        if (!goal) {
          return res.status(404).json({ message: 'Goal not found' });
        }

        // Calculate fresh analytics
        const analytics = goal.calculateAnalytics();

        // Get progress history with formatted data
        const progressHistory = goal.progressHistory.map(entry => ({
          value: entry.value,
          date: entry.date,
          note: entry.note || null,
        }));

        // Calculate additional insights
        const insights = {
          totalDaysTracked: goal.progressHistory.length,
          completionRate: goal.completed ? 100 : goal.progress,
          currentStreak: goal.streak.current || 0,
          bestStreak: goal.streak.best || 0,
          lastUpdate: goal.analytics.lastProgressUpdate,
          totalUpdates: goal.analytics.totalUpdates || 0,
        };

        // Calculate weekly progress
        const weeklyProgress = calculateWeeklyProgress(goal.progressHistory);

        // Get best performing days
        const bestDays = getBestPerformingDays(goal.progressHistory);

        return res.status(200).json({
          goalId: goal._id,
          title: goal.title,
          type: goal.type,
          analytics,
          progressHistory,
          insights,
          weeklyProgress,
          bestDays,
          streak: goal.streak,
        });
      } catch (error) {
        console.error('Error fetching goal analytics:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

function calculateWeeklyProgress(progressHistory) {
  const weeks = {};
  const now = new Date();
  
  progressHistory.forEach(entry => {
    const weekStart = new Date(entry.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        startDate: weekStart,
        updates: 0,
        averageProgress: 0,
        progressValues: [],
      };
    }
    
    weeks[weekKey].updates++;
    weeks[weekKey].progressValues.push(entry.value);
  });
  
  // Calculate averages and format
  return Object.values(weeks).map(week => ({
    weekStart: week.startDate,
    updates: week.updates,
    averageProgress: week.progressValues.reduce((a, b) => a + b, 0) / week.progressValues.length,
    maxProgress: Math.max(...week.progressValues),
    minProgress: Math.min(...week.progressValues),
  })).sort((a, b) => b.weekStart - a.weekStart).slice(0, 8); // Last 8 weeks
}

function getBestPerformingDays(progressHistory) {
  const dayStats = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  progressHistory.forEach(entry => {
    const dayOfWeek = new Date(entry.date).getDay();
    const dayName = dayNames[dayOfWeek];
    
    if (!dayStats[dayName]) {
      dayStats[dayName] = {
        count: 0,
        totalProgress: 0,
      };
    }
    
    dayStats[dayName].count++;
    dayStats[dayName].totalProgress += entry.value;
  });
  
  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day,
      averageProgress: stats.totalProgress / stats.count,
      updateCount: stats.count,
    }))
    .sort((a, b) => b.averageProgress - a.averageProgress);
}

export default verifyToken(handler);