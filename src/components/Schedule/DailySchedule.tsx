import React, { useState, useEffect, useCallback } from 'react';
import { Goal } from '../../types';
import { Clock, Check, Coffee, Briefcase, Dumbbell, Brain, DollarSign, Users, Moon, Sun, Utensils, Settings, X } from 'lucide-react';

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
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState(() => {
    const saved = localStorage.getItem('scheduleWakeUpTime');
    return saved || '06:00';
  });
  const [sleepTime, setSleepTime] = useState(() => {
    const saved = localStorage.getItem('scheduleSleepTime');
    return saved || '22:00';
  });
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

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

  const convertTimeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const convertMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const adjustScheduleToTimes = useCallback((wakeTime: string, bedTime: string) => {
    const wakeMinutes = convertTimeToMinutes(wakeTime);
    const bedMinutes = convertTimeToMinutes(bedTime);
    const totalAwakeMinutes = bedMinutes > wakeMinutes ? 
      bedMinutes - wakeMinutes : 
      (24 * 60) - wakeMinutes + bedMinutes;

    const originalBlocks = [
      { id: 'wake', activity: 'Wake up & Morning hydration', category: 'routine' as const, icon: <Sun className="w-4 h-4" />, duration: 15, priority: 1 },
      { id: 'exercise', activity: 'Morning exercise & stretching', category: 'physical' as const, icon: <Dumbbell className="w-4 h-4" />, duration: 45, priority: 2 },
      { id: 'shower', activity: 'Shower & get ready', category: 'routine' as const, icon: <Coffee className="w-4 h-4" />, duration: 30, priority: 2 },
      { id: 'breakfast', activity: 'Healthy breakfast', category: 'meal' as const, icon: <Utensils className="w-4 h-4" />, duration: 30, priority: 2 },
      { id: 'meditation', activity: 'Meditation & journaling', category: 'mental' as const, icon: <Brain className="w-4 h-4" />, duration: 20, priority: 3 },
      { id: 'work1', activity: 'Deep work block 1', category: 'work' as const, icon: <Briefcase className="w-4 h-4" />, duration: 120, priority: 4 },
      { id: 'break1', activity: 'Short break & snack', category: 'routine' as const, icon: <Coffee className="w-4 h-4" />, duration: 15, priority: 5 },
      { id: 'work2', activity: 'Deep work block 2', category: 'work' as const, icon: <Briefcase className="w-4 h-4" />, duration: 105, priority: 5 },
      { id: 'lunch', activity: 'Lunch break', category: 'meal' as const, icon: <Utensils className="w-4 h-4" />, duration: 45, priority: 6 },
      { id: 'social', activity: 'Connect with friends/family', category: 'social' as const, icon: <Users className="w-4 h-4" />, duration: 30, priority: 7 },
      { id: 'work3', activity: 'Afternoon work session', category: 'work' as const, icon: <Briefcase className="w-4 h-4" />, duration: 120, priority: 7 },
      { id: 'break2', activity: 'Afternoon break', category: 'routine' as const, icon: <Coffee className="w-4 h-4" />, duration: 15, priority: 8 },
      { id: 'financial', activity: 'Review finances & budget', category: 'financial' as const, icon: <DollarSign className="w-4 h-4" />, duration: 30, priority: 8 },
      { id: 'work4', activity: 'Wrap up work tasks', category: 'work' as const, icon: <Briefcase className="w-4 h-4" />, duration: 90, priority: 8 },
      { id: 'exercise2', activity: 'Evening walk or light exercise', category: 'physical' as const, icon: <Dumbbell className="w-4 h-4" />, duration: 30, priority: 9 },
      { id: 'dinner', activity: 'Dinner', category: 'meal' as const, icon: <Utensils className="w-4 h-4" />, duration: 45, priority: 9 },
      { id: 'family', activity: 'Family time / Hobbies', category: 'social' as const, icon: <Users className="w-4 h-4" />, duration: 90, priority: 10 },
      { id: 'relax', activity: 'Relaxation & reading', category: 'mental' as const, icon: <Brain className="w-4 h-4" />, duration: 45, priority: 11 },
      { id: 'prepare', activity: 'Prepare for tomorrow', category: 'routine' as const, icon: <Moon className="w-4 h-4" />, duration: 20, priority: 12 },
      { id: 'sleep', activity: 'Bedtime routine & sleep', category: 'routine' as const, icon: <Moon className="w-4 h-4" />, duration: 30, priority: 13 },
    ];

    const totalOriginalDuration = originalBlocks.reduce((sum, block) => sum + block.duration, 0);
    const scaleFactor = Math.min(1, (totalAwakeMinutes - 30) / totalOriginalDuration);
    
    let currentTime = wakeMinutes;
    const adjustedBlocks: TimeBlock[] = [];

    originalBlocks.forEach(block => {
      if (block.id === 'sleep') {
        const adjustedBlock = {
          ...block,
          time: convertMinutesToTime(bedMinutes - 30),
          duration: 30
        };
        adjustedBlocks.push(adjustedBlock);
      } else {
        const adjustedDuration = Math.max(
          block.category === 'meal' ? 20 : 10,
          Math.round(block.duration * scaleFactor)
        );
        
        const adjustedBlock = {
          ...block,
          time: convertMinutesToTime(currentTime),
          duration: adjustedDuration
        };
        
        adjustedBlocks.push(adjustedBlock);
        currentTime += adjustedDuration;
        
        if (currentTime >= bedMinutes - 30) {
          return;
        }
      }
    });

    return adjustedBlocks;
  }, []);

  const applyScheduleChanges = () => {
    localStorage.setItem('scheduleWakeUpTime', wakeUpTime);
    localStorage.setItem('scheduleSleepTime', sleepTime);
    
    const newSchedule = adjustScheduleToTimes(wakeUpTime, sleepTime);
    setTimeBlocks(newSchedule);
    setShowScheduleSettings(false);
  };

  useEffect(() => {
    const savedWakeTime = localStorage.getItem('scheduleWakeUpTime');
    const savedSleepTime = localStorage.getItem('scheduleSleepTime');
    
    if (savedWakeTime && savedSleepTime) {
      const adjustedSchedule = adjustScheduleToTimes(savedWakeTime, savedSleepTime);
      setTimeBlocks(adjustedSchedule);
    } else {
      const defaultSchedule = adjustScheduleToTimes('06:00', '22:00');
      setTimeBlocks(defaultSchedule);
    }
  }, [adjustScheduleToTimes]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-indigo-600" />
          Daily Schedule
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowScheduleSettings(true)}
            className="flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <Settings className="w-4 h-4 mr-1" />
            Schedule Settings
          </button>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
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

      {showScheduleSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Schedule Settings</h3>
              <button
                onClick={() => setShowScheduleSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wake Up Time
                </label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Time
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleSettings(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyScheduleChanges}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySchedule;