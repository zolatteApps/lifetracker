import React from 'react';
import { Goal } from '../../types';
import { Heart, Brain, DollarSign, Users, Check, Circle } from 'lucide-react';

interface CategoryCardProps {
  goal: Goal;
  onUpdateProgress: (goalId: string, actionItemId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ goal, onUpdateProgress }) => {
  const getIcon = () => {
    switch (goal.category) {
      case 'physical':
        return <Heart className="w-6 h-6 text-red-500" />;
      case 'mental':
        return <Brain className="w-6 h-6 text-purple-500" />;
      case 'financial':
        return <DollarSign className="w-6 h-6 text-green-500" />;
      case 'social':
        return <Users className="w-6 h-6 text-blue-500" />;
    }
  };

  const getCategoryColor = () => {
    switch (goal.category) {
      case 'physical':
        return 'border-red-200 bg-red-50';
      case 'mental':
        return 'border-purple-200 bg-purple-50';
      case 'financial':
        return 'border-green-200 bg-green-50';
      case 'social':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${getCategoryColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-800 ml-3">{goal.title}</h3>
        </div>
        <span className="text-sm font-medium text-gray-600">{goal.progress}% Complete</span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{goal.description}</p>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items:</h4>
        {goal.actionItems.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => onUpdateProgress(goal.id, item.id)}
          >
            <div className="flex items-center flex-1">
              {item.completed ? (
                <Check className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 mr-2" />
              )}
              <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {item.title}
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryCard;