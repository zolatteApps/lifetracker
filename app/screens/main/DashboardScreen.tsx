import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { GoalsService } from '../../../shared/services/goals.service';
import { Goal } from '../../../shared/types';
import { Ionicons } from '@expo/vector-icons';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { key: 'physical', label: 'Physical', icon: 'fitness', color: '#10B981' },
    { key: 'mental', label: 'Mental', icon: 'brain', color: '#8B5CF6' },
    { key: 'financial', label: 'Financial', icon: 'cash', color: '#F59E0B' },
    { key: 'social', label: 'Social', icon: 'people', color: '#3B82F6' },
  ] as const;

  const loadGoals = async () => {
    if (!user) return;

    try {
      const userGoals = await GoalsService.getUserGoals(user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  const getCategoryProgress = (category: Goal['category']) => {
    const categoryGoals = goals.filter(g => g.category === category);
    if (categoryGoals.length === 0) return 0;
    
    const totalProgress = categoryGoals.reduce((sum, goal) => sum + goal.progress, 0);
    return Math.round(totalProgress / categoryGoals.length);
  };

  const getActiveGoalsCount = (category: Goal['category']) => {
    return goals.filter(g => g.category === category && !g.completed).length;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.displayName || 'there'}!</Text>
        <Text style={styles.subtitle}>Track your progress across all life areas</Text>
      </View>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[styles.categoryCard, { borderTopColor: category.color }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
              <Ionicons
                name={category.icon as any}
                size={32}
                color={category.color}
              />
            </View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.goalCount}>
              {getActiveGoalsCount(category.key)} active goals
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getCategoryProgress(category.key)}%`,
                    backgroundColor: category.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {getCategoryProgress(category.key)}% Complete
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{goals.length}</Text>
          <Text style={styles.statLabel}>Total Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {goals.filter(g => g.completed).length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {goals.filter(g => !g.completed).length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1.5%',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 24,
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});