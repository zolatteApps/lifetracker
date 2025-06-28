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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch
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
  const [autoGenerate, setAutoGenerate] = useState(true);


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

  const handleAutoCreate = async () => {
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

  const handleManualCreate = () => {
    if (!goalText.trim()) {
      Alert.alert('Error', 'Please enter a goal');
      return;
    }
    
    // Create default goal structure for manual mode
    const defaultGoalDetails = {
      title: goalText.trim(),
      category: 'physical',
      description: '',
      type: 'milestone' as const,
      priority: 'medium' as const,
      proposedSchedule: {
        summary: 'Custom schedule',
        explanation: 'Create your own schedule',
        sessions: [{
          activity: goalText.trim(),
          frequency: 'weekly' as const,
          daysPerWeek: 3,
          time: '19:00',
          duration: 60,
          days: ['Mon', 'Wed', 'Fri'],
          totalOccurrences: 12,
          repeat: true,
          tags: []
        }]
      },
      isManualMode: true,
      scheduleStartDate: new Date().toISOString(),
      scheduleEndDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 84); // 12 weeks default
        return date.toISOString();
      })()
    };

    setGoalDetails(defaultGoalDetails);
    setShowSchedulePreview(true);
  };

  const handleAcceptSchedule = async () => {
    setIsCreatingGoal(true);
    
    try {
      // Prepare goal data
      const scheduleStartDate = goalDetails.scheduleStartDate ? new Date(goalDetails.scheduleStartDate) : new Date();
      const scheduleEndDate = goalDetails.scheduleEndDate ? new Date(goalDetails.scheduleEndDate) : (() => {
        const date = new Date();
        date.setDate(date.getDate() + 84); // 12 weeks default
        return date;
      })();
      
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
        completed: false,
        scheduleStartDate: scheduleStartDate,
        scheduleEndDate: scheduleEndDate
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
    // The SchedulePreviewModal now handles edit mode internally
    // This function is no longer needed but kept for backward compatibility
  };

  const handleUpdateGoalDetails = (updatedDetails: any) => {
    setGoalDetails(updatedDetails);
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
      // Check if this is a one-time task
      if (session.repeat === false) {
        // Create a single entry for one-time task
        const taskDate = session.date ? new Date(session.date) : today;
        try {
          await createScheduleEntry(taskDate, session, goal);
          createdCount++;
        } catch (error) {
          console.error(`Failed to create one-time schedule entry for ${taskDate.toDateString()}:`, error);
          errors.push({ date: taskDate.toDateString(), error });
        }
        continue; // Skip to next session
      }
      
      // Determine the end date for recurring tasks
      const taskEndDate = session.endDate ? new Date(session.endDate) : null;
      
      // Create schedule entries based on frequency
      if (session.frequency === 'daily') {
        // Create entries based on interval
        const interval = session.interval || 1;
        let currentDate = new Date(today);
        
        for (let i = 0; i < session.totalOccurrences; i++) {
          // Check if we've passed the task end date
          if (taskEndDate && currentDate > taskEndDate) {
            break;
          }
          
          try {
            await createScheduleEntry(currentDate, session, goal);
            createdCount++;
          } catch (error) {
            console.error(`Failed to create schedule entry for ${currentDate.toDateString()}:`, error);
            errors.push({ date: currentDate.toDateString(), error });
          }
          
          // Move to next scheduled day based on interval
          currentDate.setDate(currentDate.getDate() + interval);
        }
      } else if (session.frequency === 'weekly') {
        // Create weekly entries
        let occurrences = 0;
        let currentDate = new Date(today);
        
        while (occurrences < session.totalOccurrences) {
          // Check if we've passed the task end date
          if (taskEndDate && currentDate > taskEndDate) {
            break;
          }
          
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
      } else if (session.frequency === 'monthly') {
        // Create monthly entries
        const monthDay = session.monthDay || 1;
        let currentDate = new Date(today);
        
        // Set to the specified day of the current month
        currentDate.setDate(monthDay);
        
        // If the day has already passed this month, start from next month
        if (currentDate < today) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        for (let i = 0; i < session.totalOccurrences; i++) {
          // Check if we've passed the task end date
          if (taskEndDate && currentDate > taskEndDate) {
            break;
          }
          
          try {
            // Create a new date to avoid mutation issues
            const scheduleDate = new Date(currentDate);
            
            // Handle months with fewer days than the specified day
            if (scheduleDate.getDate() !== monthDay) {
              // Set to last day of the previous month if day doesn't exist
              scheduleDate.setDate(0);
            }
            
            await createScheduleEntry(scheduleDate, session, goal);
            createdCount++;
          } catch (error) {
            console.error(`Failed to create schedule entry for ${currentDate.toDateString()}:`, error);
            errors.push({ date: currentDate.toDateString(), error });
          }
          
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(monthDay);
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
      recurring: session.repeat !== false, // Set based on repeat field
      tags: session.tags || [],
      endDate: session.endDate || null,
      recurrenceRule: session.repeat !== false && session.frequency === 'daily' ? {
        frequency: 'daily',
        interval: session.interval || 1,
        endDate: session.endDate
      } : session.repeat !== false && session.frequency === 'weekly' ? {
        frequency: 'weekly',
        daysOfWeek: session.days,
        endDate: session.endDate
      } : session.repeat !== false && session.frequency === 'monthly' ? {
        frequency: 'monthly',
        dayOfMonth: session.monthDay || 1,
        endDate: session.endDate
      } : null
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.gradientContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            
            <View style={styles.goalSection}>
              <Text style={styles.goalTitle}>What's your goal?</Text>
              
              <TextInput
                style={styles.goalInput}
                placeholder="e.g., Run 5k every morning, Save $1000 monthly"
                placeholderTextColor="#9CA3AF"
                value={goalText}
                onChangeText={setGoalText}
                multiline
                maxLength={200}
                editable={!isProcessing}
              />
              
              <TouchableOpacity
                style={[styles.createGoalButton, isProcessing && styles.createGoalButtonDisabled]}
                onPress={autoGenerate ? handleAutoCreate : handleManualCreate}
                disabled={isProcessing || !goalText.trim()}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createGoalButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>✨ Auto generate schedule</Text>
                <Switch
                  value={autoGenerate}
                  onValueChange={setAutoGenerate}
                  trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
                  thumbColor={autoGenerate ? '#7C3AED' : '#9CA3AF'}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Schedule Preview Modal */}
      <SchedulePreviewModal
        visible={showSchedulePreview}
        goalDetails={goalDetails}
        onAccept={handleAcceptSchedule}
        onModify={handleModifySchedule}
        onCancel={handleCancelSchedule}
        onUpdate={handleUpdateGoalDetails}
        loading={isCreatingGoal}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: '#F0EBFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    marginBottom: 48,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  goalSection: {
    width: '100%',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  goalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 36,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  goalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 16,
    color: '#374151',
    minHeight: 140,
    maxHeight: 160,
    marginBottom: 20,
    textAlignVertical: 'top',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    lineHeight: 24,
  },
  achieveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
  },
  achieveButtonDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0.1,
  },
  achieveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  autoCreateButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  autoCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualCreateButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  manualCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  manualCreateButtonDisabled: {
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  createGoalButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    marginBottom: 16,
  },
  createGoalButtonDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0.1,
  },
  createGoalButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});