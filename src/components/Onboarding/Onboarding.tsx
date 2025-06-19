import React, { useState } from 'react';
import { ChevronRight, Target, Trophy } from 'lucide-react';
import { UserProfile } from '../../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [goals, setGoals] = useState('');
  const [achievements, setAchievements] = useState('');

  const handleSubmit = () => {
    console.log('Button clicked!');
    console.log('Goals:', goals);
    console.log('Achievements:', achievements);
    
    if (goals.trim() && achievements.trim()) {
      console.log('Submitting form...');
      onComplete({
        goals,
        achievements,
        createdAt: new Date()
      });
    } else {
      console.log('Form validation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 md:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to LifeSync</h1>
          <p className="text-gray-600">Let's create your personalized life management system</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-700 mb-3">
              <Target className="w-6 h-6 mr-2 text-indigo-600" />
              What are your goals?
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Example: I want to lose 20 pounds, save $10,000, read 24 books this year, improve my relationships..."
            />
          </div>

          <div>
            <label className="flex items-center text-lg font-semibold text-gray-700 mb-3">
              <Trophy className="w-6 h-6 mr-2 text-indigo-600" />
              What do you want to achieve?
            </label>
            <textarea
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Example: Feel confident in my body, have financial security, become well-read, have meaningful connections..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!goals.trim() || !achievements.trim()}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Get Started
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;