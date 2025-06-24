import Goal from '../../../../api/models/Goal';
import connectDB from '../../../../api/config/database';
import { verifyToken } from '../../../../api/middleware/auth';

async function handler(req, res) {
  const { method } = req;

  await connectDB();

  switch (method) {
    case 'GET':
      try {
        const goals = await Goal.find({ userId: req.userId });

        if (!goals.length) {
          return res.status(200).json({
            totalGoals: 0,
            completedGoals: 0,
            inProgressGoals: 0,
            completionRate: 0,
            categoryBreakdown: {},
            recentActivity: [],
            streakData: {},
          });
        }

        // Overall statistics
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.completed).length;
        const inProgressGoals = totalGoals - completedGoals;
        const completionRate = (completedGoals / totalGoals) * 100;

        // Category breakdown
        const categoryBreakdown = {
          physical: { total: 0, completed: 0, averageProgress: 0, activeStreaks: 0 },
          mental: { total: 0, completed: 0, averageProgress: 0, activeStreaks: 0 },
          financial: { total: 0, completed: 0, averageProgress: 0, activeStreaks: 0 },
          social: { total: 0, completed: 0, averageProgress: 0, activeStreaks: 0 },
        };

        goals.forEach(goal => {
          const category = goal.category;
          categoryBreakdown[category].total++;
          
          if (goal.completed) {
            categoryBreakdown[category].completed++;
          }
          
          categoryBreakdown[category].averageProgress += goal.progress;
          
          if (goal.streak && goal.streak.current > 0) {
            categoryBreakdown[category].activeStreaks++;
          }
        });

        // Calculate averages
        Object.keys(categoryBreakdown).forEach(category => {
          if (categoryBreakdown[category].total > 0) {
            categoryBreakdown[category].averageProgress = 
              Math.round(categoryBreakdown[category].averageProgress / categoryBreakdown[category].total);
            categoryBreakdown[category].completionRate = 
              Math.round((categoryBreakdown[category].completed / categoryBreakdown[category].total) * 100);
          }
        });

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivity = [];
        goals.forEach(goal => {
          goal.progressHistory
            .filter(entry => entry.date > sevenDaysAgo)
            .forEach(entry => {
              recentActivity.push({
                goalId: goal._id,
                goalTitle: goal.title,
                category: goal.category,
                progress: entry.value,
                date: entry.date,
                type: goal.type,
              });
            });
        });

        recentActivity.sort((a, b) => b.date - a.date);

        // Streak data
        const streakData = {
          totalActiveStreaks: 0,
          longestCurrentStreak: 0,
          longestEverStreak: 0,
          habitGoalsWithStreaks: [],
        };

        goals
          .filter(g => g.type === 'habit' && g.streak)
          .forEach(goal => {
            if (goal.streak.current > 0) {
              streakData.totalActiveStreaks++;
              streakData.longestCurrentStreak = Math.max(streakData.longestCurrentStreak, goal.streak.current);
            }
            
            streakData.longestEverStreak = Math.max(streakData.longestEverStreak, goal.streak.best || 0);
            
            if (goal.streak.current > 0) {
              streakData.habitGoalsWithStreaks.push({
                goalId: goal._id,
                title: goal.title,
                currentStreak: goal.streak.current,
                bestStreak: goal.streak.best,
              });
            }
          });

        // Weekly momentum
        const weeklyMomentum = calculateWeeklyMomentum(goals);

        // Projected completions
        const projectedCompletions = goals
          .filter(g => !g.completed && g.analytics && g.analytics.projectedCompletionDate)
          .map(g => ({
            goalId: g._id,
            title: g.title,
            category: g.category,
            projectedDate: g.analytics.projectedCompletionDate,
            currentProgress: g.progress,
          }))
          .sort((a, b) => new Date(a.projectedDate) - new Date(b.projectedDate))
          .slice(0, 5); // Top 5 upcoming completions

        return res.status(200).json({
          totalGoals,
          completedGoals,
          inProgressGoals,
          completionRate: Math.round(completionRate),
          categoryBreakdown,
          recentActivity: recentActivity.slice(0, 10), // Last 10 activities
          streakData,
          weeklyMomentum,
          projectedCompletions,
        });
      } catch (error) {
        console.error('Error fetching goals analytics summary:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

function calculateWeeklyMomentum(goals) {
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  thisWeek.setHours(0, 0, 0, 0);

  const lastWeek = new Date(thisWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);

  let thisWeekUpdates = 0;
  let lastWeekUpdates = 0;
  let thisWeekProgress = 0;
  let lastWeekProgress = 0;

  goals.forEach(goal => {
    goal.progressHistory.forEach(entry => {
      if (entry.date >= thisWeek) {
        thisWeekUpdates++;
        thisWeekProgress += entry.value;
      } else if (entry.date >= lastWeek && entry.date < thisWeek) {
        lastWeekUpdates++;
        lastWeekProgress += entry.value;
      }
    });
  });

  const momentum = {
    thisWeekUpdates,
    lastWeekUpdates,
    updateChange: lastWeekUpdates > 0 ? ((thisWeekUpdates - lastWeekUpdates) / lastWeekUpdates) * 100 : 0,
    thisWeekAverageProgress: thisWeekUpdates > 0 ? thisWeekProgress / thisWeekUpdates : 0,
    lastWeekAverageProgress: lastWeekUpdates > 0 ? lastWeekProgress / lastWeekUpdates : 0,
  };

  momentum.progressChange = momentum.lastWeekAverageProgress > 0 
    ? ((momentum.thisWeekAverageProgress - momentum.lastWeekAverageProgress) / momentum.lastWeekAverageProgress) * 100 
    : 0;

  return momentum;
}

export default verifyToken(handler);