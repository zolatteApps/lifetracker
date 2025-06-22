import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import goalService, { Goal } from '../../services/goalService';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { GoalCreationModal } from '../../components/GoalCreationModal';
import { GoalProgressModal } from '../../components/GoalProgressModal';

const categories = [
  { key: 'physical', label: 'Physical', icon: 'fitness', color: '#10B981' },
  { key: 'mental', label: 'Mental', icon: 'library', color: '#8B5CF6' },
  { key: 'financial', label: 'Financial', icon: 'cash', color: '#F59E0B' },
  { key: 'social', label: 'Social', icon: 'people', color: '#3B82F6' },
] as const;

export const GoalsScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [modalPrefillData, setModalPrefillData] = useState<any>(null);

  const fetchGoals = async () => {
    try {
      const fetchedGoals = await goalService.getGoals();
      setGoals(fetchedGoals);
      // Save offline for backup
      await goalService.saveGoalsOffline(fetchedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Try to load offline goals
      const offlineGoals = await goalService.getOfflineGoals();
      if (offlineGoals) {
        setGoals(offlineGoals);
        Alert.alert('Offline Mode', 'Showing cached goals. Some features may be limited.');
      } else {
        Alert.alert('Error', 'Failed to load goals');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  // Handle navigation params
  useEffect(() => {
    if (route.params?.openAddModal && route.params?.prefillData) {
      console.log('GoalsScreen: Received prefillData:', route.params.prefillData);
      const categoryData = categories.find(c => c.key === route.params.prefillData.category);
      if (categoryData) {
        setSelectedCategory(categoryData);
        setModalPrefillData(route.params.prefillData);
        setModalVisible(true);
      }
      // Clear params to prevent re-opening
      navigation.setParams({ openAddModal: false, prefillData: null });
    } else if (route.params?.category) {
      setFilterCategory(route.params.category);
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchGoals();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const handleCreateGoal = async (goal: Omit<Goal, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'completed'>) => {
    try {
      const newGoal = await goalService.createGoal({
        ...goal,
        completed: false,
      });

      setGoals(prev => [...prev, newGoal]);
      Alert.alert('Success!', 'Goal created successfully!');
      await fetchGoals(); // Refresh to ensure sync
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
      console.error('Error creating goal:', error);
      throw error;
    }
  };

  const openGoalModal = (category: typeof categories[0]) => {
    setSelectedCategory(category);
    setModalPrefillData(null); // Clear any previous prefill data
    setModalVisible(true);
  };

  const openProgressModal = (goal: Goal, category: typeof categories[0]) => {
    setSelectedGoal(goal);
    setSelectedCategory(category);
    setProgressModalVisible(true);
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const goal = goals.find(g => (g._id || g.id) === goalId);
      if (!goal) return;

      const progressData = goal.type === 'milestone' 
        ? { progress: newValue }
        : { currentValue: newValue };

      const updatedGoal = await goalService.updateProgress(goalId, progressData);
      setGoals(prev => prev.map(g => 
        (g._id || g.id) === goalId ? updatedGoal : g
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
      console.error('Error updating progress:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalService.deleteGoal(goalId);
              setGoals(prev => prev.filter(g => (g._id || g.id) !== goalId));
              Alert.alert('Success', 'Goal deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal');
              console.error('Error deleting goal:', error);
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <Text style={styles.subtitle}>Track your progress across all life areas</Text>
        {filterCategory && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={styles.clearFilterText}>Clear filter ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {categories
        .filter(category => !filterCategory || category.key === filterCategory)
        .map((category) => {
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
                onPress={() => openGoalModal(category)}
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
                <TouchableOpacity
                  key={goal._id || goal.id}
                  style={styles.goalCard}
                  onPress={() => !goal.completed && openProgressModal(goal, category)}
                  onLongPress={() => deleteGoal(goal._id || goal.id || '')}
                  activeOpacity={0.9}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={[
                      styles.goalProgress,
                      goal.completed && styles.completedProgress
                    ]}>
                      {goal.progress}%
                    </Text>
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
                              backgroundColor: goal.completed ? '#10B981' : category.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
                      </Text>
                    </View>
                  )}

                  {goal.type === 'habit' && (
                    <View style={styles.habitContainer}>
                      <Text style={styles.habitText}>
                        {goal.currentValue} / {goal.targetValue} days this month
                      </Text>
                    </View>
                  )}

                  {goal.completed && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </TouchableOpacity>
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
        </View>
      )}

      {selectedCategory && (
        <>
          <GoalCreationModal
            visible={modalVisible}
            category={selectedCategory.key}
            categoryColor={selectedCategory.color}
            onClose={() => {
              setModalVisible(false);
              setSelectedCategory(null);
              setModalPrefillData(null);
            }}
            onSave={handleCreateGoal}
            prefillData={modalPrefillData}
          />
          <GoalProgressModal
            visible={progressModalVisible}
            goal={selectedGoal}
            categoryColor={selectedCategory.color}
            onClose={() => {
              setProgressModalVisible(false);
              setSelectedGoal(null);
            }}
            onUpdate={updateGoalProgress}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  completedProgress: {
    color: '#10B981',
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
    minWidth: 80,
    textAlign: 'right',
  },
  habitContainer: {
    marginTop: 8,
  },
  habitText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    fontSize: 13,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
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
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  clearFilterButton: {
    marginTop: 12,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});