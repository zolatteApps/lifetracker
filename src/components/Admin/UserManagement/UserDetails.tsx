import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Goal } from '../../../types';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  UserCheck,
  Target,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import GoalDetailsModal from '../GoalDetails/GoalDetailsModal';

const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    role: '',
    isPhoneVerified: false,
    isOnboardingCompleted: false
  });
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setUser(data.user);
      setGoals(data.goals);
      setEditData({
        role: data.user.role,
        isPhoneVerified: data.user.isPhoneVerified,
        isOnboardingCompleted: data.user.isOnboardingCompleted
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) throw new Error('Failed to update user');

      const data = await response.json();
      setUser(data.user);
      setEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete user');

      navigate('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. They might be your own account.');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

  const handleGoalDelete = (goalId: string) => {
    // Remove the deleted goal from the local state
    setGoals(prevGoals => prevGoals.filter(goal => 
      (goal.id || goal._id) !== goalId
    ));
    // Close the modal
    setShowGoalModal(false);
    setSelectedGoal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      physical: 'bg-blue-100 text-blue-800',
      mental: 'bg-green-100 text-green-800',
      financial: 'bg-yellow-100 text-yellow-800',
      social: 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            to="/admin/users"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <button
                onClick={handleUpdate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit size={16} className="mr-2" />
                Edit User
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} className="mr-2" />
                Delete User
              </button>
            </>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{user.name || 'Not provided'}</p>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <Mail size={16} className="mr-1" />
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <Phone size={16} className="mr-1" />
                Phone
              </label>
              <p className="text-gray-900">
                {user.phoneNumber || 'Not provided'}
                {user.phoneNumber && user.isPhoneVerified && (
                  <span className="ml-2 text-green-600 text-sm">(Verified)</span>
                )}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500">Role</label>
              {editing ? (
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <p className="text-gray-900 flex items-center">
                  {user.role === 'admin' && <Shield size={16} className="mr-1 text-purple-600" />}
                  {user.role}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500">Status</label>
              {editing ? (
                <div className="space-y-2 mt-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.isPhoneVerified}
                      onChange={(e) => setEditData({ ...editData, isPhoneVerified: e.target.checked })}
                      className="mr-2"
                    />
                    Phone Verified
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.isOnboardingCompleted}
                      onChange={(e) => setEditData({ ...editData, isOnboardingCompleted: e.target.checked })}
                      className="mr-2"
                    />
                    Onboarding Completed
                  </label>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {user.isOnboardingCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <UserCheck size={12} className="mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Onboarding
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar size={16} className="mr-1" />
                Joined
              </label>
              <p className="text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Additional Profile Info */}
        {(user.age || user.gender || user.height) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Profile Details</h3>
            <div className="grid grid-cols-3 gap-4">
              {user.age && (
                <div>
                  <label className="text-xs text-gray-500">Age</label>
                  <p className="text-sm text-gray-900">{user.age} years</p>
                </div>
              )}
              {user.gender && (
                <div>
                  <label className="text-xs text-gray-500">Gender</label>
                  <p className="text-sm text-gray-900 capitalize">{user.gender.replace('_', ' ')}</p>
                </div>
              )}
              {user.height && (
                <div>
                  <label className="text-xs text-gray-500">Height</label>
                  <p className="text-sm text-gray-900">
                    {user.height.value} {user.height.unit}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target size={20} className="mr-2" />
          User Goals ({goals.length})
        </h2>
        {goals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No goals created yet</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div 
                key={goal.id || goal._id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md group"
                onClick={() => handleGoalClick(goal)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{goal.title}</h3>
                      <ChevronRight className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Target size={14} className="mr-1" />
                      {goal.type}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp size={14} className="mr-1" />
                      {goal.progress || 0}%
                    </span>
                    <span>Priority: {goal.priority}</span>
                  </div>
                  {goal.completed && (
                    <span className="text-green-600 text-sm font-medium">Completed</span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Goal Details Modal */}
      <GoalDetailsModal
        goal={selectedGoal}
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setSelectedGoal(null);
        }}
        userId={userId || ''}
        onDelete={handleGoalDelete}
      />
    </div>
  );
};

export default UserDetails;