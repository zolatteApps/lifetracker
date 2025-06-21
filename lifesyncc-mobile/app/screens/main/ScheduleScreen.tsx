import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext-mongodb';

interface TimeSlot {
  id: string;
  time: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'personal';
  completed: boolean;
}

const categoryColors = {
  physical: '#10B981',
  mental: '#8B5CF6',
  financial: '#F59E0B',
  social: '#3B82F6',
  personal: '#EC4899',
};

export const ScheduleScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Sample schedule data
  const [schedule] = useState<TimeSlot[]>([
    {
      id: '1',
      time: '06:00 AM',
      title: 'Morning Run',
      category: 'physical',
      completed: true,
    },
    {
      id: '2',
      time: '07:00 AM',
      title: 'Meditation',
      category: 'mental',
      completed: true,
    },
    {
      id: '3',
      time: '09:00 AM',
      title: 'Work on Budget',
      category: 'financial',
      completed: false,
    },
    {
      id: '4',
      time: '12:00 PM',
      title: 'Lunch with Team',
      category: 'social',
      completed: false,
    },
    {
      id: '5',
      time: '03:00 PM',
      title: 'Personal Project Time',
      category: 'personal',
      completed: false,
    },
    {
      id: '6',
      time: '06:00 PM',
      title: 'Evening Workout',
      category: 'physical',
      completed: false,
    },
  ]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your schedule</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Schedule</Text>
        <Text style={styles.date}>{formatDate(selectedDate)}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{schedule.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {schedule.filter(item => item.completed).length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.scheduleList}>
        {schedule.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.scheduleItem,
              item.completed && styles.completedItem,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.timeContainer}>
              <Text style={[styles.time, item.completed && styles.completedText]}>
                {item.time}
              </Text>
            </View>
            
            <View style={styles.taskContainer}>
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: categoryColors[item.category] },
                ]}
              />
              <View style={styles.taskDetails}>
                <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
                  {item.title}
                </Text>
                <Text style={[styles.taskCategory, item.completed && styles.completedText]}>
                  {item.category}
                </Text>
              </View>
              {item.completed && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleList: {
    paddingHorizontal: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completedItem: {
    opacity: 0.7,
  },
  timeContainer: {
    marginRight: 16,
    minWidth: 80,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  taskContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
});