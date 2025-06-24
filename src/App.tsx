import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Auth from './components/Auth';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard/AdminDashboard';
import UserManagement from './components/Admin/UserManagement/UserList';
import UserDetails from './components/Admin/UserManagement/UserDetails';
import FeedbackManagement from './components/Admin/FeedbackManagement/FeedbackList';
import Analytics from './components/Admin/Analytics/Analytics';
import { UserProfile, User } from './types';

const defaultUserProfile: UserProfile = {
  goals: "Build healthy habits, improve productivity, develop meaningful relationships, and achieve financial stability",
  achievements: "Feel energized and confident, maintain work-life balance, create lasting connections, and have peace of mind about finances",
  createdAt: new Date()
};

function App() {
  const [userProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    console.log('Initial userProfile from localStorage:', saved);
    return saved ? JSON.parse(saved) : defaultUserProfile;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('token') !== null;
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    console.log('UserProfile updated:', userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    setIsAuthenticated(token !== null);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} 
          />
          <Route 
            path="/auth" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard userProfile={userProfile} /> : <Navigate to="/auth" />} 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminLayout isAdmin={isAdmin} /> : <Navigate to="/auth" />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/:userId" element={<UserDetails />} />
            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;