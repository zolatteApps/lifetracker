import React, { useState } from 'react';
import { Goal } from '../../types';
import { Clock, Check, Coffee, Briefcase, Dumbbell, Brain, DollarSign, Users, Moon, Sun, Utensils } from 'lucide-react';

interface DailyScheduleProps {
  goals: Goal[];
}

interface TimeBlock {
  id: string;
  time: string;
  activity: string;
  category?: 'physical' | 'mental' | 'financial' | 'social' | 'routine' | 'work' | 'meal';
  icon: React.ReactNode;
  duration: number; // in minutes
  completed?: boolean;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ goals }) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { id: 'wake', time: '6:00 AM', activity: 'Wake up & Morning hydration', category: 'routine', icon: <Sun className="w-4 h-4" />, duration: 15 },
    { id: 'exercise', time: '6:15 AM', activity: 'Morning exercise & stretching', category: 'physical', icon: <Dumbbell className="w-4 h-4" />, duration: 45 },
    { id: 'shower', time: '7:00 AM', activity: 'Shower & get ready', category: 'routine', icon: <Coffee className="w-4 h-4" />, duration: 30 },
    { id: 'breakfast', time: '7:30 AM', activity: 'Healthy breakfast', category: 'meal', icon: <Utensils className="w-4 h-4" />, duration: 30 },
    { id: 'meditation', time: '8:00 AM', activity: 'Meditation & journaling', category: 'mental', icon: <Brain className="w-4 h-4" />, duration: 20 },
    { id: 'work1', time: '8:30 AM', activity: 'Deep work block 1', category: 'work', icon: <Briefcase className="w-4 h-4" />, duration: 120 },
    { id: 'break1', time: '10:30 AM', activity: 'Short break & snack', category: 'routine', icon: <Coffee className="w-4 h-4" />, duration: 15 },
    { id: 'work2', time: '10:45 AM', activity: 'Deep work block 2', category: 'work', icon: <Briefcase className="w-4 h-4" />, duration: 105 },
    { id: 'lunch', time: '12:30 PM', activity: 'Lunch break', category: 'meal', icon: <Utensils className="w-4 h-4" />, duration: 45 },
    { id: 'social', time: '1:15 PM', activity: 'Connect with friends/family', category: 'social', icon: <Users className="w-4 h-4" />, duration: 30 },
    { id: 'work3', time: '1:45 PM', activity: 'Afternoon work session', category: 'work', icon: <Briefcase className="w-4 h-4" />, duration: 120 },
    { id: 'break2', time: '3:45 PM', activity: 'Afternoon break', category: 'routine', icon: <Coffee className="w-4 h-4" />, duration: 15 },
    { id: 'financial', time: '4:00 PM', activity: 'Review finances & budget', category: 'financial', icon: <DollarSign className="w-4 h-4" />, duration: 30 },
    { id: 'work4', time: '4:30 PM', activity: 'Wrap up work tasks', category: 'work', icon: <Briefcase className="w-4 h-4" />, duration: 90 },
    { id: 'exercise2', time: '6:00 PM', activity: 'Evening walk or light exercise', category: 'physical', icon: <Dumbbell className="w-4 h-4" />, duration: 30 },
    { id: 'dinner', time: '6:30 PM', activity: 'Dinner', category: 'meal', icon: <Utensils className="w-4 h-4" />, duration: 45 },
    { id: 'family', time: '7:15 PM', activity: 'Family time / Hobbies', category: 'social', icon: <Users className="w-4 h-4" />, duration: 90 },
    { id: 'relax', time: '8:45 PM', activity: 'Relaxation & reading', category: 'mental', icon: <Brain className="w-4 h-4" />, duration: 45 },
    { id: 'prepare', time: '9:30 PM', activity: 'Prepare for tomorrow', category: 'routine', icon: <Moon className="w-4 h-4" />, duration: 20 },
    { id: 'sleep', time: '10:00 PM', activity: 'Bedtime routine & sleep', category: 'routine', icon: <Moon className="w-4 h-4" />, duration: 480 },
  ]);

  const toggleCompleted = (id: string) => {
    setTimeBlocks(blocks =>
      blocks.map(block =>
        block.id === id ? { ...block, completed: !block.completed } : block
      )
    );
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'physical': return 'bg-red-100 text-red-700 border-red-200';
      case 'mental': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'financial': return 'bg-green-100 text-green-700 border-green-200';
      case 'social': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'work': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'meal': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCurrentTimeBlock = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i];
      const [time, period] = block.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let blockMinutes = hours * 60 + minutes;
      
      if (period === 'PM' && hours !== 12) blockMinutes += 12 * 60;
      if (period === 'AM' && hours === 12) blockMinutes = minutes;
      
      const nextBlock = timeBlocks[i + 1];
      if (nextBlock) {
        const [nextTime, nextPeriod] = nextBlock.time.split(' ');
        const [nextHours, nextMinutes] = nextTime.split(':').map(Number);
        let nextBlockMinutes = nextHours * 60 + nextMinutes;
        
        if (nextPeriod === 'PM' && nextHours !== 12) nextBlockMinutes += 12 * 60;
        if (nextPeriod === 'AM' && nextHours === 12) nextBlockMinutes = nextMinutes;
        
        if (currentMinutes >= blockMinutes && currentMinutes < nextBlockMinutes) {
          return block.id;
        }
      }
    }
    
    return null;
  };

  const currentBlockId = getCurrentTimeBlock();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-indigo-600" />
          Daily Schedule
        </h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {timeBlocks.map((block) => (
          <div
            key={block.id}
            className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${
              getCategoryColor(block.category)
            } ${
              currentBlockId === block.id ? 'ring-2 ring-indigo-500 shadow-md' : ''
            } ${
              block.completed ? 'opacity-75' : ''
            } hover:shadow-sm cursor-pointer`}
            onClick={() => toggleCompleted(block.id)}
          >
            <div className="flex items-center flex-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm mr-3">
                {block.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{block.time}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm">{block.activity}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Duration: {block.duration} mins
                </div>
              </div>
              {block.completed && (
                <Check className="w-5 h-5 text-green-600 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {timeBlocks.filter(b => b.completed).length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {timeBlocks.length}
          </div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {Math.round((timeBlocks.filter(b => b.completed).length / timeBlocks.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600">Progress</div>
        </div>
      </div>
    </div>
  );
};

export default DailySchedule;