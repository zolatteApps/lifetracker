import React, { useState, useEffect } from 'react';
import { AdminStats } from '../../../types';
import { 
  TrendingUp, 
  Users, 
  Target, 
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const userMetrics = [
    {
      label: 'Total Users',
      value: stats.users.totalUsers,
      change: '+12%',
      trend: 'up'
    },
    {
      label: 'Verified Users',
      value: stats.users.verifiedUsers,
      percentage: Math.round((stats.users.verifiedUsers / stats.users.totalUsers) * 100),
      trend: 'up'
    },
    {
      label: 'Completed Onboarding',
      value: stats.users.completedOnboarding,
      percentage: Math.round((stats.users.completedOnboarding / stats.users.totalUsers) * 100),
      trend: 'up'
    },
    {
      label: 'Admin Users',
      value: stats.users.adminUsers,
      trend: 'neutral'
    }
  ];

  const goalCategories = [
    { name: 'Physical', value: stats.goals.physicalGoals, color: 'bg-blue-500' },
    { name: 'Mental', value: stats.goals.mentalGoals, color: 'bg-green-500' },
    { name: 'Financial', value: stats.goals.financialGoals, color: 'bg-yellow-500' },
    { name: 'Social', value: stats.goals.socialGoals, color: 'bg-purple-500' }
  ];

  const totalGoalValue = goalCategories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Time</option>
          <option value="month">Last Month</option>
          <option value="week">Last Week</option>
          <option value="day">Today</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {userMetrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              {metric.trend === 'up' && <TrendingUp size={16} className="text-green-600" />}
              {metric.trend === 'down' && <TrendingUp size={16} className="text-red-600 transform rotate-180" />}
              {metric.trend === 'neutral' && <Activity size={16} className="text-gray-400" />}
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              {metric.percentage && (
                <span className="ml-2 text-sm text-gray-600">({metric.percentage}%)</span>
              )}
              {metric.change && (
                <span className={`ml-2 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Completion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target size={20} className="mr-2" />
            Goal Completion Rate
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.goals.totalGoals > 0 
                    ? Math.round((stats.goals.completedGoals / stats.goals.totalGoals) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.goals.totalGoals > 0 
                      ? (stats.goals.completedGoals / stats.goals.totalGoals) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Goals</span>
                <span className="font-medium">{stats.goals.totalGoals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed Goals</span>
                <span className="font-medium text-green-600">{stats.goals.completedGoals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">In Progress</span>
                <span className="font-medium text-blue-600">
                  {stats.goals.totalGoals - stats.goals.completedGoals}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart size={20} className="mr-2" />
            Goal Distribution by Category
          </h2>
          <div className="space-y-4">
            {goalCategories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm text-gray-600">
                    {category.value} ({totalGoalValue > 0 ? Math.round((category.value / totalGoalValue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${category.color} h-2 rounded-full transition-all duration-300`}
                    style={{ 
                      width: `${totalGoalValue > 0 ? (category.value / totalGoalValue) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Goals Across All Categories</p>
              <p className="text-3xl font-bold text-gray-900">{stats.goals.totalGoals}</p>
            </div>
          </div>
        </div>

        {/* Feedback Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare size={20} className="mr-2" />
            Feedback Overview
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.feedback.pendingFeedback}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.feedback.reviewedFeedback}</p>
                <p className="text-sm text-gray-600">Reviewed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.feedback.resolvedFeedback}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.feedback.totalFeedback > 0
                    ? Math.round((stats.feedback.resolvedFeedback / stats.feedback.totalFeedback) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 size={20} className="mr-2" />
            User Engagement
          </h2>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Average Goals per User</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.users.totalUsers > 0 
                  ? (stats.goals.totalGoals / stats.users.totalUsers).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Users with Goals</span>
                <span className="text-sm font-medium">
                  {Math.min(stats.goals.totalGoals, stats.users.totalUsers)} / {stats.users.totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Users (Onboarded)</span>
                <span className="text-sm font-medium">
                  {stats.users.completedOnboarding} / {stats.users.totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Verified Phone Numbers</span>
                <span className="text-sm font-medium">
                  {stats.users.verifiedUsers} / {stats.users.totalUsers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Platform Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-blue-700 mb-1">User Activation Rate</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.users.totalUsers > 0 
                ? Math.round((stats.users.completedOnboarding / stats.users.totalUsers) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-700 mb-1">Goal Success Rate</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.goals.totalGoals > 0 
                ? Math.round((stats.goals.completedGoals / stats.goals.totalGoals) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-700 mb-1">Support Response Rate</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.feedback.totalFeedback > 0
                ? Math.round(((stats.feedback.reviewedFeedback + stats.feedback.resolvedFeedback) / stats.feedback.totalFeedback) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;