import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Auth from './components/Auth';
import { UserProfile } from './types';

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

  useEffect(() => {
    console.log('UserProfile updated:', userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(token !== null);
  }, []);

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;