import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    // Mock sign in for now
    console.log('Sign in:', email);
    setUser({ email, id: '123' });
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Mock sign up for now
    console.log('Sign up:', email);
    setUser({ email, id: '123', displayName });
  };

  const signOut = async () => {
    console.log('Sign out');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    console.log('Reset password:', email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};