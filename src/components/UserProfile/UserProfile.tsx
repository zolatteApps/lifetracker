import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile"
      >
        <div className="profile-icon">
          {getInitial()}
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-icon-large">
              {getInitial()}
            </div>
            <div className="profile-info">
              <p className="profile-email">{user?.email || 'User'}</p>
              <p className="profile-member-since">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
              </p>
            </div>
          </div>
          
          <div className="profile-divider"></div>
          
          <button className="profile-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;