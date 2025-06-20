import React, { useState, useEffect } from 'react';
import { UserProfile, Goal } from '../../types';
import CategoryCard from './CategoryCard';
import DailySchedule from '../Schedule/DailySchedule';
import CheckInModal from '../CheckIn/CheckInModal';
import GoalModal from '../Goals/GoalModal';
import { Calendar, Target, BarChart3, Clock } from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'physical' | 'mental' | 'financial' | 'social'>('physical');
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      // Convert date strings back to Date objects
      const goalsWithDates = parsedGoals.map((goal: any) => ({
        ...goal,
        createdAt: new Date(goal.createdAt),
        ...(goal.dueDate && { dueDate: new Date(goal.dueDate) })
      }));
      setGoals(goalsWithDates);
    }
  }, []);

  useEffect(() => {
    const checkInInterval = setInterval(() => {
      const now = new Date();
      if (!lastCheckIn || (now.getTime() - lastCheckIn.getTime()) > 30 * 60 * 1000) {
        setShowCheckIn(true);
      }
    }, 60000);

    return () => clearInterval(checkInInterval);
  }, [lastCheckIn]);

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('userGoals', JSON.stringify(updatedGoals));
  };

  const handleAddGoal = (category: 'physical' | 'mental' | 'financial' | 'social') => {
    setSelectedCategory(category);
    setShowGoalModal(true);
  };

  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    saveGoals(updatedGoals);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
  };

  const getGoalsByCategory = (category: 'physical' | 'mental' | 'financial' | 'social') => {
    return goals.filter(goal => goal.category === category);
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
            {(['physical', 'mental', 'financial', 'social'] as const).map(category => {
              const categoryGoals = getGoalsByCategory(category);
              const categoryProgress = categoryGoals.length > 0 
                ? Math.round(categoryGoals.reduce((sum, goal) => sum + goal.progress, 0) / categoryGoals.length)
                : 0;
              
              const getCategoryTitle = (cat: string) => {
                switch (cat) {
                  case 'physical': return 'Physical Health';
                  case 'mental': return 'Mental Health';
                  case 'financial': return 'Financial Goals';
                  case 'social': return 'Social Relationships';
                  default: return cat;
                }
              };

              return (
                <div key={category} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{getCategoryTitle(category)}</span>
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${categoryProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{categoryProgress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showSchedule && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule View</h3>
              <p className="text-gray-600">Schedule generation is being updated to work with the new goal system.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['physical', 'mental', 'financial', 'social'] as const).map(category => (
              <CategoryCard
                key={category}
                category={category}
                goals={getGoalsByCategory(category)}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
              />
            ))}
          </div>
          <div className="lg:col-span-1">
            <DailySchedule goals={goals} />
          </div>
        </div>
      </main>

      {showCheckIn && (
        <CheckInModal
          goals={goals}
          onClose={handleCheckInComplete}
        />
      )}

      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleSaveGoal}
        category={selectedCategory}
      />
    </div>
  );
};

export default Dashboard;