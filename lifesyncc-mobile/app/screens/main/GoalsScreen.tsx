import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface Goal {
  id: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  title: string;
  description: string;
  type: 'milestone' | 'numeric' | 'habit';
  progress: number;
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
}

const categories = [
  { key: 'physical', label: 'Physical', icon: 'fitness', color: '#10B981' },
  { key: 'mental', label: 'Mental', icon: 'library', color: '#8B5CF6' },
  { key: 'financial', label: 'Financial', icon: 'cash', color: '#F59E0B' },
  { key: 'social', label: 'Social', icon: 'people', color: '#3B82F6' },
] as const;

export const GoalsScreen: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);

  const addSampleGoal = (category: Goal['category']) => {
    const sampleGoals = {
      physical: {
        title: 'Daily Morning Run',
        description: 'Run 5km every morning to improve fitness',
        type: 'habit' as const,
        targetValue: 30,
        currentValue: 5,
      },
      mental: {
        title: 'Read 12 Books This Year',
        description: 'Expand knowledge by reading one book per month',
        type: 'numeric' as const,
        targetValue: 12,
        currentValue: 2,
      },
      financial: {
        title: 'Emergency Fund Goal',
        description: 'Save $10,000 for emergency fund',
        type: 'numeric' as const,
        targetValue: 10000,
        currentValue: 2500,
      },
      social: {
        title: 'Weekly Friend Meetups',
        description: 'Meet with friends at least once per week',
        type: 'habit' as const,
        targetValue: 4,
        currentValue: 1,
      },
    };

    const sampleGoal = sampleGoals[category];
    const progress = sampleGoal.targetValue ? 
      Math.round((sampleGoal.currentValue! / sampleGoal.targetValue) * 100) : 0;

    const newGoal: Goal = {
      id: Date.now().toString(),
      category,
      title: sampleGoal.title,
      description: sampleGoal.description,
      type: sampleGoal.type,
      progress,
      targetValue: sampleGoal.targetValue,
      currentValue: sampleGoal.currentValue,
      completed: false,
    };

    setGoals(prev => [...prev, newGoal]);
    Alert.alert('Success!', `${sampleGoal.title} added successfully!`);
  };

  const getCategoryGoals = (category: Goal['category']) => {
    return goals.filter(goal => goal.category === category);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your goals</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <Text style={styles.subtitle}>Track your progress across all life areas</Text>
      </View>

      {categories.map((category) => {
        const categoryGoals = getCategoryGoals(category.key);
        
        return (
          <View key={category.key} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                <Text style={styles.goalCount}>({categoryGoals.length})</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: category.color }]}
                onPress={() => addSampleGoal(category.key)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {categoryGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No goals yet</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first {category.label.toLowerCase()} goal</Text>
              </View>
            ) : (
              categoryGoals.map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgress}>{goal.progress}%</Text>
                  </View>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                  
                  {goal.type === 'numeric' && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${goal.progress}%`,
                              backgroundColor: category.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {goal.currentValue} / {goal.targetValue}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        );
      })}

      {goals.length === 0 && (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to LifeSync! 🎯</Text>
          <Text style={styles.welcomeText}>
            Start by adding your first goal in any category. Tap the + button next to a category to get started.
          </Text>
          <Text style={styles.mockNote}>
            📱 Demo Mode: Goals are stored locally for testing
          </Text>
        </View>
      )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  goalCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 60,
    textAlign: 'right',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    margin: 24,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  mockNote: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
});