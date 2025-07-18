import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';
import apiService from '../services/api.service';

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: {
    value: number;
    unit: 'cm' | 'ft';
  };
  isOnboardingCompleted?: boolean;
  profileCompletedAt?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('Checking auth status...');
    try {
      const isAuthenticated = await authService.isAuthenticated();
      console.log('Is authenticated:', isAuthenticated);
      if (isAuthenticated) {
        console.log('Attempting to get current user...');
        const currentUser = await authService.getCurrentUser();
        console.log('Current user:', currentUser);
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Don't keep the user in loading state if the profile fetch fails
      const token = await authService.isAuthenticated();
      if (token) {
        // If we have a token but can't fetch profile, still consider user logged in
        console.log('Have token but profile fetch failed, continuing anyway');
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    try {
      setError(null);
      
      const response = await authService.login(email, password);
      console.log('Sign in successful:', response.user);
      setUser(response.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('Signing up user:', email, 'with name:', name);
    try {
      setError(null);
      
      const response = await authService.register(email, password, name);
      console.log('Sign up successful:', response.user);
      console.log('User isOnboardingCompleted:', response.user?.isOnboardingCompleted);
      setUser(response.user);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, otp: string) => {
    console.log('Signing in with phone:', phoneNumber);
    try {
      setError(null);
      
      const response = await authService.verifyOTP(phoneNumber, otp);
      console.log('Phone sign in successful:', response.user);
      setUser(response.user);
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      setError(error.message || 'Failed to verify OTP');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        console.log('Refreshed user data:', currentUser);
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithPhone,
    signOut,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};