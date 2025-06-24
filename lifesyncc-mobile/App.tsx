import React from 'react';
import { AuthProvider } from './app/contexts/AuthContext-mongodb';
import { ThemeProvider } from './app/contexts/ThemeContext';
import { AppNavigator } from './app/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
