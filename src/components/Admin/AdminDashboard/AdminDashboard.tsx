import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  MessageSquare, 
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AdminStats, User, Feedback } from '../../../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      // In production (Vercel), use relative URL. In dev, use localhost
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : '';
      const response = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      setRecentUsers(data.recentActivity.users);
      setRecentFeedback(data.recentActivity.feedback);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
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

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.totalUsers || 0,
      icon: Users,
      color: 'blue',
      subtext: `${stats?.users.verifiedUsers || 0} verified`,
    },
    {
      title: 'Total Goals',
      value: stats?.goals.totalGoals || 0,
      icon: Target,
      color: 'green',
      subtext: `${stats?.goals.completedGoals || 0} completed`,
    },
    {
      title: 'Feedback',
      value: stats?.feedback.totalFeedback || 0,
      icon: MessageSquare,
      color: 'yellow',
      subtext: `${stats?.feedback.pendingFeedback || 0} pending`,
    },
    {
      title: 'Completion Rate',
      value: stats?.goals.totalGoals 
        ? `${Math.round((stats.goals.completedGoals / stats.goals.totalGoals) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'purple',
      subtext: 'Goal completion',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                <card.icon size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 mt-2">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users size={20} className="mr-2" />
              Recent Users
            </h2>
          </div>
          <div className="p-6">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-center">No recent users</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isOnboardingCompleted ? (
                        <UserCheck size={16} className="text-green-600" />
                      ) : (
                        <Clock size={16} className="text-yellow-600" />
                      )}
                      {user.role === 'admin' && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Admin</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare size={20} className="mr-2" />
              Recent Feedback
            </h2>
          </div>
          <div className="p-6">
            {recentFeedback.length === 0 ? (
              <p className="text-gray-500 text-center">No recent feedback</p>
            ) : (
              <div className="space-y-3">
                {recentFeedback.map((feedback) => (
                  <div key={feedback._id} className="p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        feedback.category === 'bug' 
                          ? 'bg-red-100 text-red-600'
                          : feedback.category === 'feature'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {feedback.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        feedback.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : feedback.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {feedback.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">{feedback.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {typeof feedback.userId === 'object' ? feedback.userId.name || feedback.userId.email : 'Unknown User'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Distribution */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Goal Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: 'Physical', count: stats?.goals.physicalGoals || 0, color: 'blue' },
            { category: 'Mental', count: stats?.goals.mentalGoals || 0, color: 'green' },
            { category: 'Financial', count: stats?.goals.financialGoals || 0, color: 'yellow' },
            { category: 'Social', count: stats?.goals.socialGoals || 0, color: 'purple' },
          ].map((item) => (
            <div key={item.category} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getColorClasses(item.color)} mb-2`}>
                <span className="text-2xl font-bold">{item.count}</span>
              </div>
              <p className="text-sm text-gray-600">{item.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;