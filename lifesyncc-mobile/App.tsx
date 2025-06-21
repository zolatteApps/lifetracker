import React from 'react';
import { AuthProvider } from './app/contexts/AuthContext-native';
import { AppNavigator } from './app/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
