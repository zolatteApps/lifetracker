import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>🎉 LifeSync Mobile</Text>
      <Text style={styles.subtitle}>Expo + Firebase Setup Complete!</Text>
      <Text style={styles.text}>Ready for development</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4F46E5',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});