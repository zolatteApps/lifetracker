import React, { useState, useEffect } from 'react';
import { Goal } from '../../../types';
import {
  X,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Activity,
  Flag,
  Layers,
  BarChart2
} from 'lucide-react';

interface GoalDetailsModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  goal,
  isOpen,
  onClose,
  userId
}) => {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);

  useEffect(() => {
    if (goal && isOpen) {
      fetchGoalDetails();
    }
  }, [goal, isOpen]);

  const fetchGoalDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch schedule data if available
      const scheduleResponse = await fetch(
        `${apiUrl}/api/schedule?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (scheduleResponse.ok) {
        const schedules = await scheduleResponse.json();
        // Find schedule related to this goal
        const relatedSchedule = schedules.find((s: any) => 
          s.sessions?.some((session: any) => 
            session.activity?.toLowerCase().includes(goal?.title.toLowerCase() || '')
          )
        );
        setScheduleData(relatedSchedule);
      }
      
      // In a real app, you'd fetch progress history from the API
      // For now, we'll use mock data
      setProgressHistory([
        { date: new Date().toISOString(), value: goal?.progress || 0 },
      ]);
      
    } catch (error) {
      console.error('Error fetching goal details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !goal) return null;

  const getCategoryColor = (category: string) => {
    const colors = {
      physical: 'bg-blue-100 text-blue-800 border-blue-200',
      mental: 'bg-green-100 text-green-800 border-green-200',
      financial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      social: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Flag size={16} />;
      case 'numeric':
        return <BarChart2 size={16} />;
      case 'habit':
        return <Activity size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Goal Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Goal Overview */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{goal.title}</h3>
                    <p className="text-gray-600">{goal.description}</p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(goal.category)}`}>
                      {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      {getTypeIcon(goal.type)}
                      <span className="ml-2">Type</span>
                    </div>
                    <p className="font-medium text-gray-900 capitalize">{goal.type}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <Flag size={16} />
                      <span className="ml-2">Priority</span>
                    </div>
                    <p className={`font-medium capitalize inline-flex items-center px-2 py-0.5 rounded ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <TrendingUp size={16} />
                      <span className="ml-2">Progress</span>
                    </div>
                    <p className="font-medium text-gray-900">{goal.progress || 0}%</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      {goal.completed ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      <span className="ml-2">Status</span>
                    </div>
                    <p className={`font-medium ${goal.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                      {goal.completed ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-medium text-gray-900">{goal.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              {scheduleData && (
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="mr-2" size={20} />
                    Schedule Information
                  </h4>
                  <div className="space-y-3">
                    {scheduleData.sessions?.map((session: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{session.activity}</h5>
                          <span className="text-sm text-gray-500">
                            {session.frequency} • {session.duration} min
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          <span>{session.time}</span>
                          {session.days && session.days.length > 0 && (
                            <span className="ml-4">Days: {session.days.join(', ')}</span>
                          )}
                        </div>
                        {session.totalOccurrences && (
                          <p className="text-sm text-gray-500 mt-1">
                            Total sessions: {session.totalOccurrences}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(goal.createdAt)}
                    </span>
                  </div>
                  {goal.scheduleStartDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Schedule Start</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(goal.scheduleStartDate)}
                      </span>
                    </div>
                  )}
                  {goal.scheduleEndDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Schedule End</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(goal.scheduleEndDate)}
                      </span>
                    </div>
                  )}
                  {goal.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(goal.updatedAt)}
                      </span>
                    </div>
                  )}
                  {goal.completed && goal.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium text-green-600">
                        {formatDate(goal.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Goal Details */}
              {(goal.targetValue || goal.unit) && (
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Layers className="mr-2" size={20} />
                    Goal Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {goal.targetValue && (
                      <div>
                        <span className="text-gray-600">Target Value</span>
                        <p className="font-medium text-gray-900 text-lg">
                          {goal.targetValue} {goal.unit || ''}
                        </p>
                      </div>
                    )}
                    {goal.currentValue !== undefined && (
                      <div>
                        <span className="text-gray-600">Current Value</span>
                        <p className="font-medium text-gray-900 text-lg">
                          {goal.currentValue} {goal.unit || ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailsModal;