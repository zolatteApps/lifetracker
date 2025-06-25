import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import { API_URL } from '../../config/api';
import goalService from '../../services/goalService';
import ProgressChart from '../../components/goals/ProgressChart';
import StreakCalendar from '../../components/goals/StreakCalendar';
import GoalAnalyticsCard from '../../components/goals/GoalAnalyticsCard';
import { GoalProgressModal } from '../../components/GoalProgressModal';

export const GoalDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  const { goal: initialGoal, category } = route.params;
  const [goal, setGoal] = useState(initialGoal);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progressModalVisible, setProgressModalVisible] = useState(false);

  useEffect(() => {
    fetchGoalAnalytics();
  }, []);

  // Refetch goal data to ensure we have the latest
  const refetchGoal = async () => {
    try {
      const goals = await goalService.getGoals();
      const updatedGoal = goals.find(g => (g._id || g.id) === (goal._id || goal.id));
      if (updatedGoal) {
        setGoal(updatedGoal);
      }
    } catch (error) {
      console.error('Error refetching goal:', error);
    }
  };

  const fetchGoalAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/goals/${goal._id || goal.id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching goal analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (newValue: number) => {
    try {
      const progressData = goal.type === 'milestone' 
        ? { progress: newValue }
        : { currentValue: newValue };

      console.log('Updating goal progress:', progressData);
      console.log('Current goal state before update:', goal);
      const updatedGoal = await goalService.updateProgress(goal._id || goal.id, progressData);
      console.log('Updated goal received from API:', updatedGoal);
      console.log('Updated goal progress value:', updatedGoal.progress);
      
      // Update the local goal state with the response from the API
      setGoal(updatedGoal);
      console.log('Goal state updated in component');
      
      // Close the modal first
      setProgressModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Progress updated successfully!');
      
      // Refresh analytics
      await fetchGoalAnalytics();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
      console.error('Error updating progress:', error);
    }
  };

  const deleteGoal = () => {
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
              await goalService.deleteGoal(goal._id || goal.id);
              Alert.alert('Success', 'Goal deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal');
              console.error('Error deleting goal:', error);
            }
          },
        },
      ]
    );
  };

  const renderProgressInfo = () => {
    if (goal.type === 'milestone') {
      return (
        <View style={[styles.progressInfo, { backgroundColor: theme.surface }]}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            Overall Progress
          </Text>
          <View style={styles.progressRow}>
            <Text style={[styles.progressValue, { color: theme.text }]}>
              {goal.progress}%
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${goal.progress}%`,
                    backgroundColor: category.color,
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.progressInfo, { backgroundColor: theme.surface }]}>
        <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
          Current Progress
        </Text>
        <View style={styles.progressRow}>
          <Text style={[styles.progressValue, { color: theme.text }]}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${goal.progress}%`,
                  backgroundColor: category.color,
                }
              ]} 
            />
          </View>
        </View>
        <Text style={[styles.progressPercentage, { color: theme.textSecondary }]}>
          {goal.progress}% Complete
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: category.color }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.categoryBadge}>
            <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.categoryText}>{category.label}</Text>
          </View>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          {goal.dueDate && (
            <Text style={styles.dueDate}>
              Due: {new Date(goal.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={deleteGoal}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderProgressInfo()}

        <View style={[styles.descriptionCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.descriptionLabel, { color: theme.textSecondary }]}>
            Description
          </Text>
          <Text style={[styles.descriptionText, { color: theme.text }]}>
            {goal.description}
          </Text>
        </View>

        {!goal.completed && (
          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: category.color }]}
            onPress={() => setProgressModalVisible(true)}
          >
            <MaterialCommunityIcons name="progress-upload" size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>Update Progress</Text>
          </TouchableOpacity>
        )}

        {analytics && (
          <>
            <GoalAnalyticsCard 
              analytics={{
                averageProgressPerDay: analytics.analytics?.averageProgressPerDay || 0,
                projectedCompletionDate: analytics.analytics?.projectedCompletionDate,
                totalUpdates: analytics.analytics?.totalUpdates || 0,
                completionRate: goal.progress,
                currentStreak: analytics.streak?.current,
                bestStreak: analytics.streak?.best,
              }}
              goalType={goal.type}
            />

            {analytics.progressHistory && analytics.progressHistory.length > 0 && (
              <ProgressChart 
                data={analytics.progressHistory}
                title="Progress History"
              />
            )}

            {goal.type === 'habit' && analytics.streak && (
              <StreakCalendar
                streakData={analytics.progressHistory?.map((p: any) => ({
                  date: p.date,
                  completed: p.value > 0,
                })) || []}
                currentStreak={analytics.streak.current || 0}
                bestStreak={analytics.streak.best || 0}
              />
            )}

            {analytics.weeklyProgress && analytics.weeklyProgress.length > 0 && (
              <View style={[styles.weeklyStats, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Weekly Breakdown
                </Text>
                {analytics.weeklyProgress.slice(0, 4).map((week: any, index: number) => (
                  <View key={index} style={styles.weekRow}>
                    <Text style={[styles.weekLabel, { color: theme.textSecondary }]}>
                      Week of {new Date(week.weekStart).toLocaleDateString()}
                    </Text>
                    <View style={styles.weekStats}>
                      <Text style={[styles.weekValue, { color: theme.text }]}>
                        {Math.round(week.averageProgress)}%
                      </Text>
                      <Text style={[styles.weekUpdates, { color: theme.textSecondary }]}>
                        {week.updates} updates
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {analytics.bestDays && analytics.bestDays.length > 0 && (
              <View style={[styles.bestDaysCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Best Performing Days
                </Text>
                <View style={styles.daysGrid}>
                  {analytics.bestDays.slice(0, 3).map((day: any) => (
                    <View key={day.day} style={[styles.dayCard, { backgroundColor: theme.background }]}>
                      <Text style={[styles.dayName, { color: theme.text }]}>
                        {day.day}
                      </Text>
                      <Text style={[styles.dayProgress, { color: category.color }]}>
                        {Math.round(day.averageProgress)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      <GoalProgressModal
        visible={progressModalVisible}
        onClose={() => setProgressModalVisible(false)}
        goal={goal}
        categoryColor={category.color}
        onUpdate={updateGoalProgress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  headerContent: {
    marginTop: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 16,
  },
  progressInfo: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressRow: {
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 14,
    marginTop: 4,
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  weeklyStats: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekLabel: {
    flex: 1,
    fontSize: 14,
  },
  weekStats: {
    alignItems: 'flex-end',
  },
  weekValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekUpdates: {
    fontSize: 12,
    marginTop: 2,
  },
  bestDaysCard: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dayName: {
    fontSize: 14,
    marginBottom: 8,
  },
  dayProgress: {
    fontSize: 20,
    fontWeight: '700',
  },
});