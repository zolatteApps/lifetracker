import React, { useState, useEffect } from 'react';
import { Goal, ScheduleBlock } from '../../types';
import { generateSchedule } from '../../utils/scheduleGenerator';
import { Clock, CheckCircle, Circle } from 'lucide-react';

interface ScheduleProps {
  goals: Goal[];
}

const Schedule: React.FC<ScheduleProps> = ({ goals }) => {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const generatedSchedule = generateSchedule(goals);
    setSchedule(generatedSchedule);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [goals]);

  const toggleTaskCompletion = (blockId: string) => {
    setSchedule(prev => prev.map(block =>
      block.id === blockId ? { ...block, completed: !block.completed } : block
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'physical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'mental':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'financial':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'social':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const isCurrentBlock = (block: ScheduleBlock) => {
    const now = currentTime;
    const [startHour, startMinute] = block.startTime.split(':').map(Number);
    const [endHour, endMinute] = block.endTime.split(':').map(Number);
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Today's Schedule</h2>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-200"></div>
        
        {hours.map(hour => (
          <div key={hour} className="flex items-start mb-4">
            <div className="w-16 text-sm text-gray-500 font-medium">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            <div className="flex-1 min-h-[60px]">
              {schedule
                .filter(block => parseInt(block.startTime.split(':')[0]) === hour)
                .map(block => (
                  <div
                    key={block.id}
                    className={`mb-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      getCategoryColor(block.category)
                    } ${isCurrentBlock(block) ? 'ring-2 ring-indigo-500 shadow-md' : ''} ${
                      block.completed ? 'opacity-60' : ''
                    }`}
                    onClick={() => toggleTaskCompletion(block.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {block.completed ? (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        ) : (
                          <Circle className="w-5 h-5 mr-2" />
                        )}
                        <div>
                          <p className="font-medium">{block.title}</p>
                          <p className="text-xs opacity-75">
                            {block.startTime} - {block.endTime}
                          </p>
                        </div>
                      </div>
                      {isCurrentBlock(block) && (
                        <span className="text-xs font-semibold px-2 py-1 bg-white rounded-full">
                          NOW
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule;