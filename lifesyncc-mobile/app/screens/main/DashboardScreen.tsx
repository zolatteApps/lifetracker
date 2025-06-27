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
  Platform
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
    
    // Create default goal structure
    const defaultGoalDetails = {
      title: goalText.trim(),
      category: 'physical',
      description: '',
      type: 'milestone',
      priority: 'medium',
      proposedSchedule: {
        summary: 'Custom schedule',
        explanation: 'Create your own schedule',
        sessions: [{
          activity: goalText.trim(),
          frequency: 'weekly',
          daysPerWeek: 1,
          time: '19:00',
          duration: 60,
          days: ['Mon'],
          totalOccurrences: 4
        }]
      },
      isManualMode: true
    };

    setGoalDetails(defaultGoalDetails);
    setShowSchedulePreview(true);
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
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'dhruv'}!</Text>
            <Text style={styles.subtitle}>Track your progress across all life areas</Text>
            
            <View style={styles.goalSection}>
              <Text style={styles.goalTitle}>What's your goal?</Text>
              <Text style={styles.goalSubtitle}>AI will automatically categorize it for you</Text>
              
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
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.autoCreateButton, isProcessing && styles.achieveButtonDisabled]}
                  onPress={handleAutoCreate}
                  disabled={isProcessing || !goalText.trim()}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#fff" />
                      <Text style={styles.autoCreateButtonText}>Auto Create</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.manualCreateButton, !goalText.trim() && styles.manualCreateButtonDisabled]}
                  onPress={handleManualCreate}
                  disabled={!goalText.trim()}
                >
                  <Ionicons name="create-outline" size={20} color="#7C3AED" />
                  <Text style={styles.manualCreateButtonText}>Manual Create</Text>
                </TouchableOpacity>
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
  goalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 16,
    color: '#374151',
    minHeight: 140,
    maxHeight: 160,
    marginBottom: 28,
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
});