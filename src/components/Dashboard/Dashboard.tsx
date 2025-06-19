import React, { useState, useEffect } from 'react';
import { UserProfile, Goal } from '../../types';
import { processGoals } from '../../utils/goalProcessor';
import CategoryCard from './CategoryCard';
import Schedule from '../Schedule/Schedule';
import CheckInModal from '../CheckIn/CheckInModal';
import { Calendar, Target, BarChart3, Clock } from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    const processedGoals = processGoals(userProfile.goals, userProfile.achievements);
    setGoals(processedGoals);
    
    const savedGoals = localStorage.getItem('goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      localStorage.setItem('goals', JSON.stringify(processedGoals));
    }
  }, [userProfile]);

  useEffect(() => {
    const checkInInterval = setInterval(() => {
      const now = new Date();
      if (!lastCheckIn || (now.getTime() - lastCheckIn.getTime()) > 30 * 60 * 1000) {
        setShowCheckIn(true);
      }
    }, 60000);

    return () => clearInterval(checkInInterval);
  }, [lastCheckIn]);

  const updateGoalProgress = (goalId: string, actionItemId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedActionItems = goal.actionItems.map(item =>
          item.id === actionItemId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = updatedActionItems.filter(item => item.completed).length;
        const progress = Math.round((completedCount / updatedActionItems.length) * 100);
        
        return { ...goal, actionItems: updatedActionItems, progress };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
  };

  const handleCheckInComplete = () => {
    setShowCheckIn(false);
    setLastCheckIn(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">LifeSync Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {showSchedule ? 'Hide Schedule' : 'View Schedule'}
              </button>
              <button
                onClick={() => setShowCheckIn(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="w-5 h-5 mr-2" />
                Check In
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Progress Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {goals.map(goal => (
              <div key={goal.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{goal.title}</span>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showSchedule && (
          <div className="mb-8">
            <Schedule goals={goals} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => (
            <CategoryCard
              key={goal.id}
              goal={goal}
              onUpdateProgress={updateGoalProgress}
            />
          ))}
        </div>
      </main>

      {showCheckIn && (
        <CheckInModal
          goals={goals}
          onClose={handleCheckInComplete}
        />
      )}
    </div>
  );
};

export default Dashboard;