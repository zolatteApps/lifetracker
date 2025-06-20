import React, { useState } from 'react';
import { Goal } from '../../types';
import { X, Smile, Meh, Frown, ThumbsUp } from 'lucide-react';

interface CheckInModalProps {
  goals: Goal[];
  onClose: () => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ goals, onClose }) => {
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'struggling' | null>(null);
  const [notes, setNotes] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const handleSubmit = () => {
    const checkIn = {
      id: Date.now().toString(),
      timestamp: new Date(),
      mood: mood || 'okay',
      notes,
      completedTasks
    };
    
    localStorage.setItem('lastCheckIn', JSON.stringify(checkIn));
    onClose();
  };

  const moods = [
    { value: 'great', icon: <ThumbsUp className="w-8 h-8" />, color: 'text-green-600', bgColor: 'bg-green-100' },
    { value: 'good', icon: <Smile className="w-8 h-8" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'okay', icon: <Meh className="w-8 h-8" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { value: 'struggling', icon: <Frown className="w-8 h-8" />, color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Time for a Check-in!</h2>
        <p className="text-gray-600 mb-6">Let's see how your day is going</p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-3">
              {moods.map(({ value, icon, color, bgColor }) => (
                <button
                  key={value}
                  onClick={() => setMood(value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mood === value
                      ? `border-indigo-500 ${bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`${color} flex flex-col items-center`}>
                    {icon}
                    <span className="text-xs mt-1 capitalize">{value}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">What goals have you made progress on?</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {goals.filter(goal => !goal.completed).map(goal => (
                <label key={goal.id} className="flex items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={completedTasks.includes(goal.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCompletedTasks([...completedTasks, goal.id]);
                      } else {
                        setCompletedTasks(completedTasks.filter(id => id !== goal.id));
                      }
                    }}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{goal.title}</span>
                    <div className="text-xs text-gray-500 capitalize">{goal.category} • {goal.type} goal</div>
                  </div>
                </label>
              ))}
              {goals.filter(goal => !goal.completed).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No active goals to track progress on.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Any notes or reflections?</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="How can we adjust your schedule? What's working well?"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Submit Check-in
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;