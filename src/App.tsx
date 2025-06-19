import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingWrapper from './components/Onboarding/OnboardingWrapper';
import Dashboard from './components/Dashboard/Dashboard';
import { UserProfile } from './types';

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('userProfile');
    console.log('Initial userProfile from localStorage:', saved);
    return saved ? JSON.parse(saved) : null;
  });

  const handleProfileComplete = (profile: UserProfile) => {
    console.log('Profile completed:', profile);
    setUserProfile(profile);
  };

  useEffect(() => {
    console.log('UserProfile updated:', userProfile);
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={userProfile ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />} 
          />
          <Route 
            path="/onboarding" 
            element={<OnboardingWrapper onComplete={handleProfileComplete} />} 
          />
          <Route 
            path="/dashboard" 
            element={userProfile ? <Dashboard userProfile={userProfile} /> : <Navigate to="/onboarding" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;