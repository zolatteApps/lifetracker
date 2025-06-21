import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ScheduleScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Daily planning</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4F46E5',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});