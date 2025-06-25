import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import scheduleService from '../../services/schedule.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScheduleSkeleton } from '../../components/ScheduleSkeleton';

interface TimeSlot {
  id: string;
  time: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'personal';
  completed: boolean;
}

interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: Date;
  endOccurrences?: number;
  exceptions?: Date[];
}

interface ScheduleBlock {
  id: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'personal';
  startTime: string;
  endTime: string;
  completed: boolean;
  goalId?: string;
  recurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  recurrenceId?: string;
  originalDate?: Date;
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
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'personal' as const,
    startTime: '09:00',
    endTime: '10:00',
    recurring: false,
    recurrenceRule: {
      type: 'weekly' as const,
      interval: 1,
      daysOfWeek: [] as number[],
      endOccurrences: undefined as number | undefined,
      endDate: undefined as Date | undefined,
    },
  });
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'date' | 'occurrences'>('never');

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  const fetchSchedule = useCallback(async (showLoadingState = true) => {
    if (!user) return;
    
    const dateStr = scheduleService.formatDateForAPI(selectedDate);
    
    // Try to load from cache first for instant display
    if (!initialLoadComplete) {
      const cached = await scheduleService.getCachedSchedule(dateStr);
      if (cached) {
        setSchedule(cached.data.blocks || []);
        setScheduleId(cached.data._id || '');
        setLoading(false);
      }
    }
    
    try {
      // Fetch fresh data from API
      const data = await scheduleService.getSchedule(dateStr);
      setSchedule(data.blocks || []);
      setScheduleId(data._id || '');
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Only show error if we don't have cached data
      if (!schedule.length) {
        Alert.alert('Error', 'Failed to load schedule. Showing offline data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedDate, initialLoadComplete, schedule.length]);

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]); // Only depend on selectedDate to avoid loops

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule(false);
  };

  const toggleTaskCompletion = async (blockId: string) => {
    if (!scheduleId) return;
    
    const block = schedule.find(b => b.id === blockId);
    if (!block) return;
    
    try {
      const updatedSchedule = await scheduleService.updateScheduleBlock(
        scheduleId,
        blockId,
        { completed: !block.completed }
      );
      setSchedule(updatedSchedule.blocks);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    
    if (newTask.recurring && newTask.recurrenceRule.type === 'weekly' && newTask.recurrenceRule.daysOfWeek?.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week for recurring tasks');
      return;
    }
    
    const newBlock: ScheduleBlock = {
      id: scheduleService.generateBlockId(),
      title: newTask.title,
      category: newTask.category,
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      completed: false,
      recurring: newTask.recurring,
      recurrenceRule: newTask.recurring ? {
        type: newTask.recurrenceRule.type,
        interval: newTask.recurrenceRule.interval,
        daysOfWeek: newTask.recurrenceRule.daysOfWeek,
        endDate: recurrenceEndType === 'date' ? newTask.recurrenceRule.endDate : undefined,
        endOccurrences: recurrenceEndType === 'occurrences' ? newTask.recurrenceRule.endOccurrences : undefined,
      } : undefined,
      recurrenceId: newTask.recurring ? scheduleService.generateBlockId() : undefined,
    };
    
    try {
      const updatedSchedule = await scheduleService.updateSchedule(
        scheduleService.formatDateForAPI(selectedDate),
        [...schedule, newBlock]
      );
      setSchedule(updatedSchedule.blocks);
      setScheduleId(updatedSchedule._id);
      setShowAddModal(false);
      setShowRecurrenceOptions(false);
      setRecurrenceEndType('never');
      setNewTask({
        title: '',
        category: 'personal',
        startTime: '09:00',
        endTime: '10:00',
        recurring: false,
        recurrenceRule: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [],
          endOccurrences: undefined,
          endDate: undefined,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const deleteTask = async (blockId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!scheduleId) return;
            
            try {
              const updatedSchedule = await scheduleService.deleteScheduleBlock(
                scheduleId,
                blockId
              );
              setSchedule(updatedSchedule.blocks);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const convertToTimeSlots = (blocks: ScheduleBlock[]): TimeSlot[] => {
    return blocks.map(block => ({
      id: block.id,
      time: block.startTime,
      title: block.title,
      category: block.category,
      completed: block.completed,
    }));
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your schedule</Text>
      </View>
    );
  }

  // Don't block entire UI while loading
  const isInitialLoad = loading && !schedule.length;

  const timeSlots = convertToTimeSlots(schedule);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Schedule</Text>
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.date}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {isInitialLoad ? (
        <ScheduleSkeleton />
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{timeSlots.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {timeSlots.filter(item => item.completed).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.scheduleList}>
          {timeSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks scheduled for this day</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add your first task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            timeSlots.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.scheduleItem,
                  item.completed && styles.completedItem,
                ]}
                onPress={() => toggleTaskCompletion(item.id)}
                onLongPress={() => deleteTask(item.id)}
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
            ))
          )}
        </View>
        </ScrollView>
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalInner}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
            
            <TextInput
              style={styles.input}
              placeholder="Task title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryButtons}>
              {Object.keys(categoryColors).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    newTask.category === cat && styles.selectedCategory,
                    { borderColor: categoryColors[cat as keyof typeof categoryColors] }
                  ]}
                  onPress={() => setNewTask({ ...newTask, category: cat as any })}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    { color: categoryColors[cat as keyof typeof categoryColors] }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Start (HH:MM)"
                value={newTask.startTime}
                onChangeText={(text) => setNewTask({ ...newTask, startTime: text })}
              />
              <Text style={{ marginHorizontal: 8, alignSelf: 'center' }}>to</Text>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="End (HH:MM)"
                value={newTask.endTime}
                onChangeText={(text) => setNewTask({ ...newTask, endTime: text })}
              />
            </View>
            
            {/* Debug marker */}
            <Text style={{ backgroundColor: 'yellow', padding: 10, marginVertical: 10 }}>
              REPEAT TOGGLE SHOULD BE BELOW THIS
            </Text>
            
            {/* Recurrence Toggle */}
            <View style={styles.recurringContainer}>
              <Text style={styles.label}>Repeat</Text>
              <TouchableOpacity
                style={styles.recurringToggle}
                onPress={() => {
                  setNewTask({ ...newTask, recurring: !newTask.recurring });
                }}
              >
                <View style={[styles.toggleCircle, newTask.recurring && styles.toggleCircleActive]} />
                <Text style={styles.recurringToggleText}>
                  {newTask.recurring ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Recurrence Options - Show inline when recurring is enabled */}
            {newTask.recurring && (
              <View style={[styles.recurrenceOptions, { marginTop: 12 }]}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyButtons}>
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        newTask.recurrenceRule.type === freq && styles.selectedFrequency,
                      ]}
                      onPress={() => setNewTask({
                        ...newTask,
                        recurrenceRule: { ...newTask.recurrenceRule, type: freq }
                      })}
                    >
                      <Text style={[
                        styles.frequencyButtonText,
                        newTask.recurrenceRule.type === freq && styles.selectedFrequencyText,
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Weekly Days Selection */}
                {newTask.recurrenceRule.type === 'weekly' && (
                  <View style={styles.daysContainer}>
                    <Text style={styles.label}>Days of Week</Text>
                    <View style={styles.daysButtons}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            newTask.recurrenceRule.daysOfWeek?.includes(index) && styles.selectedDay,
                          ]}
                          onPress={() => {
                            const days = newTask.recurrenceRule.daysOfWeek || [];
                            const updatedDays = days.includes(index)
                              ? days.filter(d => d !== index)
                              : [...days, index];
                            setNewTask({
                              ...newTask,
                              recurrenceRule: { ...newTask.recurrenceRule, daysOfWeek: updatedDays }
                            });
                          }}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            newTask.recurrenceRule.daysOfWeek?.includes(index) && styles.selectedDayText,
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Interval */}
                <View style={styles.intervalContainer}>
                  <Text style={styles.label}>Every</Text>
                  <TextInput
                    style={[styles.input, styles.intervalInput]}
                    placeholder="1"
                    value={newTask.recurrenceRule.interval?.toString() || '1'}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setNewTask({
                        ...newTask,
                        recurrenceRule: { ...newTask.recurrenceRule, interval: num }
                      });
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.intervalText}>
                    {newTask.recurrenceRule.type === 'daily' ? 'day(s)' :
                     newTask.recurrenceRule.type === 'weekly' ? 'week(s)' :
                     newTask.recurrenceRule.type === 'monthly' ? 'month(s)' : ''}
                  </Text>
                </View>
                
                {/* End Condition */}
                <Text style={styles.label}>Ends</Text>
                <View style={styles.endButtons}>
                  {(['never', 'date', 'occurrences'] as const).map((endType) => (
                    <TouchableOpacity
                      key={endType}
                      style={[
                        styles.endButton,
                        recurrenceEndType === endType && styles.selectedEnd,
                      ]}
                      onPress={() => setRecurrenceEndType(endType)}
                    >
                      <Text style={[
                        styles.endButtonText,
                        recurrenceEndType === endType && styles.selectedEndText,
                      ]}>
                        {endType === 'never' ? 'Never' :
                         endType === 'date' ? 'On Date' : 'After'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {recurrenceEndType === 'occurrences' && (
                  <View style={styles.occurrencesContainer}>
                    <TextInput
                      style={[styles.input, styles.occurrencesInput]}
                      placeholder="10"
                      value={newTask.recurrenceRule.endOccurrences?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseInt(text) || undefined;
                        setNewTask({
                          ...newTask,
                          recurrenceRule: { ...newTask.recurrenceRule, endOccurrences: num }
                        });
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.occurrencesText}>occurrences</Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Test visibility */}
            <Text style={{ textAlign: 'center', marginVertical: 20, color: 'red' }}>
              If you can see this, scroll is working!
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addTask}
              >
                <Text style={styles.saveButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'android');
            if (date) setSelectedDate(date);
          }}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    padding: 8,
  },
  date: {
    fontSize: 16,
    color: '#4F46E5',
    marginHorizontal: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 80,
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalInner: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedCategory: {
    backgroundColor: '#f3f4f6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9ca3af',
    marginRight: 8,
  },
  toggleCircleActive: {
    backgroundColor: '#4F46E5',
  },
  recurringToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  recurrenceOptions: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  frequencyButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedFrequency: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4b5563',
  },
  selectedFrequencyText: {
    color: '#fff',
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  selectedDayText: {
    color: '#fff',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  intervalInput: {
    width: 60,
    marginHorizontal: 8,
    marginBottom: 0,
  },
  intervalText: {
    fontSize: 14,
    color: '#4b5563',
  },
  endButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  endButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedEnd: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4b5563',
  },
  selectedEndText: {
    color: '#fff',
  },
  occurrencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occurrencesInput: {
    width: 80,
    marginRight: 8,
    marginBottom: 0,
  },
  occurrencesText: {
    fontSize: 14,
    color: '#4b5563',
  },
});