import React, { useState, useEffect } from 'react';
import { Feedback } from '../../../types';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Info,
  Clock,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertCircle
} from 'lucide-react';

const FeedbackList: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchFeedback();
  }, [currentPage, statusFilter, categoryFilter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/feedback?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch feedback');

      const data = await response.json();
      setFeedback(data.feedback);
      setTotalPages(data.pagination.pages);
      
      // Initialize admin notes
      const notes: { [key: string]: string } = {};
      data.feedback.forEach((item: Feedback) => {
        notes[item._id] = item.adminNotes || '';
      });
      setAdminNotes(notes);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/feedback/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status,
            adminNotes: adminNotes[id]
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update feedback');

      const data = await response.json();
      setFeedback(feedback.map(item => 
        item._id === id ? data.feedback : item
      ));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/admin/feedback/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete feedback');

      setFeedback(feedback.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug':
        return <Bug size={16} className="text-red-600" />;
      case 'feature':
        return <Lightbulb size={16} className="text-blue-600" />;
      default:
        return <Info size={16} className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'reviewed':
        return <Eye size={16} className="text-blue-600" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-green-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Feedback Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="bug">Bug Reports</option>
              <option value="feature">Feature Requests</option>
              <option value="general">General Feedback</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      {getCategoryIcon(item.category)}
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{item.message}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      From: {typeof item.userId === 'object' ? (item.userId.name || item.userId.email) : 'Unknown User'}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(item._id)}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {expandedItems.has(item._id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedItems.has(item._id) && (
                <div className="mt-4 pt-4 border-t">
                  {editingItem === item._id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => updateFeedbackStatus(item._id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes
                        </label>
                        <textarea
                          value={adminNotes[item._id] || ''}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [item._id]: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Add notes for internal reference..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateFeedbackStatus(item._id, item.status)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteFeedback(item._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {item.adminNotes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Admin Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{item.adminNotes}</p>
                        </div>
                      )}
                      <button
                        onClick={() => setEditingItem(item._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Manage Feedback
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;