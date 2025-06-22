import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import goalService, { Goal } from '../../services/goalService';
import { SchedulePreviewModal } from '../../components/SchedulePreviewModal';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalText, setGoalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [goalDetails, setGoalDetails] = useState<any>(null);

  // Calculate statistics from goals
  const getStats = () => {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const inProgress = total - completed;
    
    return { total, completed, inProgress };
  };

  // Calculate category data from goals
  const getCategoryData = () => {
    const categoryMap = {
      physical: { label: 'Physical', icon: 'fitness', color: '#10B981' },
      mental: { label: 'Mental', icon: 'library', color: '#8B5CF6' },
      financial: { label: 'Financial', icon: 'cash', color: '#F59E0B' },
      social: { label: 'Social', icon: 'people', color: '#3B82F6' },
    };

    return Object.entries(categoryMap).map(([key, data]) => {
      const categoryGoals = goals.filter(g => g.category === key);
      
      // Calculate average progress of all goals in category
      let progress = 0;
      if (categoryGoals.length > 0) {
        const totalProgress = categoryGoals.reduce((sum, goal) => {
          return sum + (goal.progress || 0);
        }, 0);
        progress = Math.round(totalProgress / categoryGoals.length);
      }
      
      return {
        key,
        ...data,
        goals: categoryGoals.length,
        progress
      };
    });
  };

  const fetchGoals = async () => {
    try {
      const fetchedGoals = await goalService.getGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals');
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const handleAddGoal = async () => {
    if (!goalText.trim()) {
      Alert.alert('Error', 'Please enter a goal');
      return;
    }

    setIsProcessing(true);
    try {
      // First, get AI categorization
      const response = await fetch(`${goalService.API_URL}/api/goals/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await goalService.getToken()}`
        },
        body: JSON.stringify({ goalText: goalText.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to categorize goal');
      }

      const responseData = await response.json();
      console.log('DashboardScreen: AI response:', responseData);

      // Store the goal details and show schedule preview
      setGoalDetails(responseData);
      setShowSchedulePreview(true);
      
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to process your goal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptSchedule = () => {
    // Navigate to Goals screen with pre-filled data
    navigation.navigate('Goals', { 
      openAddModal: true,
      prefillData: {
        title: goalDetails.title,
        description: goalDetails.description,
        category: goalDetails.category,
        type: goalDetails.type,
        priority: goalDetails.priority,
        targetValue: goalDetails.targetValue,
        unit: goalDetails.unit,
        dueDate: goalDetails.dueDate ? new Date(goalDetails.dueDate) : undefined,
        currentValue: goalDetails.currentValue || 0,
        proposedSchedule: goalDetails.proposedSchedule
      }
    });

    // Reset state
    setShowSchedulePreview(false);
    setGoalDetails(null);
    setGoalText('');
  };

  const handleModifySchedule = () => {
    // For now, just proceed to goal creation where they can adjust manually
    // In future, we can add a schedule modification UI
    handleAcceptSchedule();
  };

  const handleCancelSchedule = () => {
    setShowSchedulePreview(false);
    setGoalDetails(null);
    // Keep the goal text so user can try again
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your dashboard</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'there'}!</Text>
        <Text style={styles.subtitle}>Track your progress across all life areas</Text>
      </View>

      <View style={styles.aiGoalSection}>
        <Text style={styles.aiGoalTitle}>What's your goal?</Text>
        <Text style={styles.aiGoalSubtitle}>AI will automatically categorize it for you</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.goalInput}
            placeholder="e.g., Run 5k every morning, Save $1000 monthly..."
            placeholderTextColor="#9ca3af"
            value={goalText}
            onChangeText={setGoalText}
            multiline
            maxLength={200}
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[styles.addButton, isProcessing && styles.addButtonDisabled]}
            onPress={handleAddGoal}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sparkles" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getStats().total}</Text>
          <Text style={styles.statLabel}>Total Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getStats().completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getStats().inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <View style={styles.categoriesGrid}>
        {getCategoryData().map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[styles.categoryCard, { borderTopColor: category.color }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Goals', { category: category.key })}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
              <Ionicons
                name={category.icon as any}
                size={32}
                color={category.color}
              />
            </View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.goalCount}>{category.goals} active goals</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${category.progress}%`,
                    backgroundColor: category.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{category.progress}% Complete</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Goals', { openAddModal: true })}
        >
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
          <Text style={styles.actionButtonText}>Add New Goal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Schedule')}
        >
          <Ionicons name="calendar" size={24} color="#4F46E5" />
          <Text style={styles.actionButtonText}>View Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Goals')}
        >
          <Ionicons name="stats-chart" size={24} color="#4F46E5" />
          <Text style={styles.actionButtonText}>Check Progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

      {/* Schedule Preview Modal */}
      <SchedulePreviewModal
        visible={showSchedulePreview}
        goalDetails={goalDetails}
        onAccept={handleAcceptSchedule}
        onModify={handleModifySchedule}
        onCancel={handleCancelSchedule}
      />
    </View>
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1f2937',
    marginBottom: 4,
  },
  goalCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActions: {
    padding: 24,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
  aiGoalSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  aiGoalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  aiGoalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  goalInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 56,
    maxHeight: 120,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});