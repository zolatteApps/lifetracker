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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import goalService, { Goal } from '../../services/goalService';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { GoalCreationModal } from '../../components/GoalCreationModal';
import { GoalProgressModal } from '../../components/GoalProgressModal';
import scheduleService from '../../services/schedule.service';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../config/api';
import ProgressChart from '../../components/goals/ProgressChart';
import StreakCalendar from '../../components/goals/StreakCalendar';
import GoalAnalyticsCard from '../../components/goals/GoalAnalyticsCard';

const categories = [
  { key: 'physical', label: 'Physical', icon: 'fitness', color: '#10B981' },
  { key: 'mental', label: 'Mental', icon: 'library', color: '#8B5CF6' },
  { key: 'financial', label: 'Financial', icon: 'cash', color: '#F59E0B' },
  { key: 'social', label: 'Social', icon: 'people', color: '#3B82F6' },
] as const;

interface GoalWithAnalytics extends Goal {
  analytics?: any;
  progressHistory?: any[];
  streak?: any;
}

export const GoalsScreenEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<GoalWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithAnalytics | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [modalPrefillData, setModalPrefillData] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [summaryAnalytics, setSummaryAnalytics] = useState<any>(null);
  const [selectedGoalAnalytics, setSelectedGoalAnalytics] = useState<any>(null);

  const fetchGoals = async () => {
    try {
      console.log('Fetching goals...');
      const fetchedGoals = await goalService.getGoals();
      console.log('Fetched goals:', fetchedGoals);
      setGoals(fetchedGoals);
      await goalService.saveGoalsOffline(fetchedGoals);
      
      // Fetch summary analytics - but don't fail if it errors
      try {
        const response = await fetch(`${API_URL}/api/goals/analytics/summary`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });
        
        if (response.ok) {
          const analytics = await response.json();
          setSummaryAnalytics(analytics);
        }
      } catch (analyticsError) {
        console.log('Analytics fetch failed, but continuing:', analyticsError);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      const offlineGoals = await goalService.getOfflineGoals();
      if (offlineGoals && offlineGoals.length > 0) {
        setGoals(offlineGoals);
        Alert.alert('Offline Mode', 'Showing cached goals. Some features may be limited.');
      } else {
        Alert.alert('Error', 'Failed to load goals. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalAnalytics = async (goalId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/goals/${goalId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const analytics = await response.json();
        setSelectedGoalAnalytics(analytics);
      }
    } catch (error) {
      console.error('Error fetching goal analytics:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchGoals();
      }
    }, [user])
  );

  const openGoalDetails = async (goal: GoalWithAnalytics, category: typeof categories[0]) => {
    setSelectedGoal(goal);
    setSelectedCategory(category);
    await fetchGoalAnalytics(goal._id || goal.id || '');
    navigation.navigate('GoalDetails' as never, { goal, category, analytics: selectedGoalAnalytics } as never);
  };

  const openGoalModal = (category: typeof categories[0]) => {
    setSelectedCategory(category);
    setModalPrefillData(null);
    setModalVisible(true);
  };

  const handleCreateGoal = async (goal: any) => {
    try {
      const newGoal = await goalService.createGoal(goal);
      setGoals(prev => [...prev, newGoal]);
      Alert.alert('Success!', 'Goal created successfully!');
      await fetchGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
      console.error('Error creating goal:', error);
    }
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
      Alert.alert('Success', 'Progress updated!');
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

  const renderAnalyticsSummary = () => {
    if (!summaryAnalytics) return null;

    return (
      <View style={[styles.analyticsContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.analyticsHeader}>
          <Text style={[styles.analyticsTitle, { color: theme.text }]}>Weekly Insights</Text>
          <TouchableOpacity onPress={() => setShowAnalytics(!showAnalytics)}>
            <MaterialCommunityIcons 
              name={showAnalytics ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>

        {showAnalytics && (
          <>
            <View style={styles.insightCards}>
              <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="trending-up" size={24} color={theme.success} />
                <Text style={[styles.insightValue, { color: theme.text }]}>
                  {summaryAnalytics.weeklyMomentum?.updateChange > 0 ? '+' : ''}
                  {Math.round(summaryAnalytics.weeklyMomentum?.updateChange || 0)}%
                </Text>
                <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                  Weekly Progress
                </Text>
              </View>

              <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="fire" size={24} color={theme.warning} />
                <Text style={[styles.insightValue, { color: theme.text }]}>
                  {summaryAnalytics.streakData?.totalActiveStreaks || 0}
                </Text>
                <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                  Active Streaks
                </Text>
              </View>

              <View style={[styles.insightCard, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="flag-checkered" size={24} color={theme.primary} />
                <Text style={[styles.insightValue, { color: theme.text }]}>
                  {summaryAnalytics.completionRate || 0}%
                </Text>
                <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                  Completion Rate
                </Text>
              </View>
            </View>

            {summaryAnalytics.projectedCompletions?.length > 0 && (
              <View style={styles.upcomingCompletions}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Upcoming Completions
                </Text>
                {summaryAnalytics.projectedCompletions.slice(0, 3).map((goal: any) => (
                  <View key={goal.goalId} style={styles.projectedGoal}>
                    <Text style={[styles.projectedGoalTitle, { color: theme.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.projectedGoalDate, { color: theme.textSecondary }]}>
                      {new Date(goal.projectedDate).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const getCategoryGoals = (category: Goal['category']) => {
    return goals.filter(goal => goal.category === category);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.message, { color: theme.text }]}>
          Please log in to view your goals
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your goals...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Goals</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Track your progress across all life areas
        </Text>
        {filterCategory && (
          <TouchableOpacity 
            style={[styles.clearFilterButton, { backgroundColor: theme.primary }]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={styles.clearFilterText}>Clear filter ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderAnalyticsSummary()}

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{goals.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Goals</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {goals.filter(g => g.completed).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statValue, { color: theme.warning }]}>
            {goals.filter(g => !g.completed).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Progress</Text>
        </View>
      </View>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => {
          const categoryGoals = getCategoryGoals(category.key);
          
          let progress = 0;
          if (categoryGoals.length > 0) {
            const totalProgress = categoryGoals.reduce((sum, goal) => {
              return sum + (goal.progress || 0);
            }, 0);
            progress = Math.round(totalProgress / categoryGoals.length);
          }
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryCard,
                { 
                  borderTopColor: category.color,
                  backgroundColor: theme.surface,
                }
              ]}
              activeOpacity={0.7}
              onPress={() => setFilterCategory(category.key)}
            >
              <View style={[styles.categoryCardIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons
                  name={category.icon as any}
                  size={32}
                  color={category.color}
                />
              </View>
              <Text style={[styles.categoryCardLabel, { color: theme.text }]}>
                {category.label}
              </Text>
              <Text style={[styles.categoryGoalCount, { color: theme.textSecondary }]}>
                {categoryGoals.length} active goals
              </Text>
              <View style={[styles.categoryProgressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.categoryProgressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.categoryProgressText, { color: theme.textSecondary }]}>
                {progress}% Complete
              </Text>
            </TouchableOpacity>
          );
        })}
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
                <Text style={[styles.categoryTitle, { color: theme.text }]}>
                  {category.label}
                </Text>
                <Text style={[styles.goalCount, { color: theme.textSecondary }]}>
                  ({categoryGoals.length})
                </Text>
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
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No goals yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                  Tap + to add your first {category.label.toLowerCase()} goal
                </Text>
              </View>
            ) : (
              categoryGoals.map((goal) => (
                <TouchableOpacity
                  key={goal._id || goal.id}
                  style={[styles.goalCard, { backgroundColor: theme.surface }]}
                  onPress={() => openGoalDetails(goal, category)}
                  onLongPress={() => deleteGoal(goal._id || goal.id || '')}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalTitle, { color: theme.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={[
                      styles.goalProgress,
                      { color: goal.completed ? theme.success : category.color }
                    ]}>
                      {goal.progress}%
                    </Text>
                  </View>
                  
                  <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                    {goal.description}
                  </Text>
                  
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${goal.progress}%`,
                          backgroundColor: goal.completed ? theme.success : category.color,
                        },
                      ]}
                    />
                  </View>

                  {goal.type === 'numeric' && (
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </Text>
                  )}

                  {goal.completed && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                      <Text style={[styles.completedText, { color: theme.success }]}>
                        Completed
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      })}

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
            category={selectedCategory}
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
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  clearFilterButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  analyticsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  insightCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  insightLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  upcomingCompletions: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  projectedGoal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  projectedGoalTitle: {
    flex: 1,
    fontSize: 14,
  },
  projectedGoalDate: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    margin: '1%',
    borderRadius: 16,
    borderTopWidth: 4,
    alignItems: 'center',
  },
  categoryCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryGoalCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  categoryProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  goalCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  goalCard: {
    margin: 16,
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
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
});