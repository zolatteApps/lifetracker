import React from 'react';
import { Goal } from '../../types';
import { Heart, Brain, DollarSign, Users, Check, Circle, Plus, Edit, Trash2, Target, Calendar } from 'lucide-react';

interface CategoryCardProps {
  category: 'physical' | 'mental' | 'financial' | 'social';
  goals: Goal[];
  onAddGoal: (category: 'physical' | 'mental' | 'financial' | 'social') => void;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (goalId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {

  const getIcon = () => {
    switch (category) {
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
    switch (category) {
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

  const getCategoryTitle = () => {
    switch (category) {
      case 'physical':
        return 'Physical Health';
      case 'mental':
        return 'Mental Health';
      case 'financial':
        return 'Financial Goals';
      case 'social':
        return 'Social Relationships';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Target className="w-4 h-4" />;
      case 'numeric':
        return <Target className="w-4 h-4" />;
      case 'habit':
        return <Circle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const toggleGoalCompletion = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      onUpdateGoal(goalId, { 
        completed: !goal.completed,
        progress: !goal.completed ? 100 : 0
      });
    }
  };

  const formatProgress = (goal: Goal) => {
    if (goal.type === 'numeric' && goal.targetValue && goal.currentValue !== undefined) {
      return `${goal.currentValue}/${goal.targetValue} ${goal.unit || ''}`;
    }
    return `${goal.progress}%`;
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${getCategoryColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-800 ml-3">{getCategoryTitle()}</h3>
        </div>
        <button
          onClick={() => onAddGoal(category)}
          className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Goal
        </button>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No goals yet. Click "Add Goal" to get started!</p>
        ) : (
          goals.map(goal => (
            <div
              key={goal.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => toggleGoalCompletion(goal.id)}
                    className="mr-3"
                  >
                    {goal.completed ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getTypeIcon(goal.type)}
                      <span className={`font-medium text-sm ml-1 ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {goal.title}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                  <button
                    onClick={() => {/* TODO: Implement goal editing */}}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  {goal.dueDate && (
                    <div className="flex items-center mr-3">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <span className="capitalize">{goal.type} Goal</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {formatProgress(goal)}
                </span>
              </div>
              
              {!goal.completed && goal.progress > 0 && (
                <div className="mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryCard;