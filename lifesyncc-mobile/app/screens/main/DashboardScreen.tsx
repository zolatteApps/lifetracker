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
import scheduleService from '../../services/schedule.service';

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
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

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

  const handleAcceptSchedule = async () => {
    setIsCreatingGoal(true);
    
    try {
      // Prepare goal data
      const goalData = {
        category: goalDetails.category,
        title: goalDetails.title,
        description: goalDetails.description,
        type: goalDetails.type,
        priority: goalDetails.priority,
        targetValue: goalDetails.targetValue,
        currentValue: goalDetails.currentValue || 0,
        unit: goalDetails.unit || '',
        dueDate: goalDetails.dueDate ? new Date(goalDetails.dueDate) : undefined,
        completed: false
      };

      // Create the goal
      const newGoal = await goalService.createGoal(goalData);
      console.log('Goal created:', newGoal);

      // Create schedule entries
      if (goalDetails.proposedSchedule) {
        await createScheduleFromProposal(goalDetails.proposedSchedule, newGoal);
      }

      // Show success and navigate to schedule
      Alert.alert(
        'Success!', 
        'Your goal and schedule have been created!',
        [
          {
            text: 'View Schedule',
            onPress: () => navigation.navigate('Schedule')
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );

      // Reset state
      setShowSchedulePreview(false);
      setGoalDetails(null);
      setGoalText('');
      
      // Refresh goals
      await fetchGoals();
      
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal and schedule. Please try again.');
    } finally {
      setIsCreatingGoal(false);
    }
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

  const createScheduleFromProposal = async (proposedSchedule: any, goal: Goal) => {
    const today = new Date();
    let createdCount = 0;
    let errors = [];
    
    for (const session of proposedSchedule.sessions) {
      // Create schedule entries based on frequency
      if (session.frequency === 'daily') {
        // Create entries for the next 30 days
        for (let i = 0; i < session.totalOccurrences; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          // Check if this day is included
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
          if (session.days.includes(dayName)) {
            try {
              await createScheduleEntry(date, session, goal);
              createdCount++;
            } catch (error) {
              console.error(`Failed to create schedule entry for ${date.toDateString()}:`, error);
              errors.push({ date: date.toDateString(), error });
            }
          }
        }
      } else if (session.frequency === 'weekly') {
        // Create weekly entries
        let occurrences = 0;
        let currentDate = new Date(today);
        
        while (occurrences < session.totalOccurrences) {
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
          if (session.days.includes(dayName)) {
            try {
              await createScheduleEntry(currentDate, session, goal);
              createdCount++;
              occurrences++;
            } catch (error) {
              console.error(`Failed to create schedule entry for ${currentDate.toDateString()}:`, error);
              errors.push({ date: currentDate.toDateString(), error });
              occurrences++; // Still increment to avoid infinite loop
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    console.log(`Created ${createdCount} schedule entries`);
    if (errors.length > 0) {
      console.error(`Failed to create ${errors.length} entries:`, errors);
    }
  };

  const createScheduleEntry = async (date: Date, session: any, goal: Goal) => {
    const dateStr = scheduleService.formatDateForAPI(date);
    
    // Ensure all required fields are present
    if (!session.activity || !goal.category) {
      console.error('Missing required data:', { session, goal });
      throw new Error('Missing required data for schedule entry');
    }
    
    const block = {
      id: scheduleService.generateBlockId(),
      startTime: session.time,
      endTime: calculateEndTime(session.time, session.duration),
      title: session.activity, // Changed from 'activity' to 'title' to match backend schema
      category: goal.category,
      goalId: goal._id || goal.id,
      completed: false,
      recurring: false // Added to match backend schema
    };

    try {
      // Get existing schedule for the date
      const existingSchedule = await scheduleService.getSchedule(dateStr);
      
      // Filter out any invalid blocks and ensure we have valid data
      const validBlocks = (existingSchedule?.blocks || []).filter(b => 
        b && b.id && b.title && b.category && b.startTime && b.endTime
      );
      
      // Add new block
      validBlocks.push(block);
      
      // Update schedule
      await scheduleService.updateSchedule(dateStr, validBlocks);
    } catch (error) {
      console.error('Error creating schedule entry:', error);
      // Re-throw to propagate error to caller
      throw error;
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
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
        loading={isCreatingGoal}
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