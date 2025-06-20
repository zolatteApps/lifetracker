import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
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

  useEffect(() => {
    console.log('UserProfile updated:', userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={<Dashboard userProfile={userProfile} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;