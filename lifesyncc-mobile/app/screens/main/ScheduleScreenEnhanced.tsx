import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import scheduleService from '../../services/schedule.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScheduleSkeleton } from '../../components/ScheduleSkeleton';
import { ScheduleViewSwitcher, ScheduleViewType } from '../../components/ScheduleViewSwitcher';
import { ScheduleWeeklyView } from '../../components/ScheduleWeeklyView';
import { ScheduleMonthlyView } from '../../components/ScheduleMonthlyView';

interface ScheduleBlock {
  id: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'personal';
  startTime: string;
  endTime: string;
  completed: boolean;
  goalId?: string;
}

const categoryColors = {
  physical: '#10B981',
  mental: '#8B5CF6',
  financial: '#F59E0B',
  social: '#3B82F6',
  personal: '#EC4899',
};

const { width: screenWidth } = Dimensions.get('window');

export const ScheduleScreenEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState<ScheduleViewType>('day');
  
  // RECURRING TASK DEBUG - If this shows up, we're editing the right file!
  console.log('🔴 RECURRING TASK DEBUG: ScheduleScreenEnhanced loaded!');
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && activeView === 'day';
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          navigateDate('prev');
        } else if (gestureState.dx < -50) {
          navigateDate('next');
        }
        Animated.spring(swipeAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        swipeAnimation.setValue(gestureState.dx);
      },
    })
  ).current;
  
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'personal' as const,
    startTime: '09:00',
    endTime: '10:00',
  });

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchSchedule = useCallback(async (showLoadingState = true) => {
    if (!user || activeView !== 'day') return;
    
    const dateStr = scheduleService.formatDateForAPI(selectedDate);
    
    if (!initialLoadComplete) {
      const cached = await scheduleService.getCachedSchedule(dateStr);
      if (cached) {
        setSchedule(cached.data.blocks || []);
        setScheduleId(cached.data._id || '');
        setLoading(false);
      }
    }
    
    try {
      const data = await scheduleService.getSchedule(dateStr);
      setSchedule(data.blocks || []);
      setScheduleId(data._id || '');
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      if (!schedule.length) {
        Alert.alert('Error', 'Failed to load schedule. Showing offline data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedDate, initialLoadComplete, schedule.length, activeView]);

  useEffect(() => {
    if (activeView === 'day') {
      fetchSchedule();
    }
  }, [selectedDate, activeView]);

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
    
    const newBlock: ScheduleBlock = {
      id: scheduleService.generateBlockId(),
      title: newTask.title,
      category: newTask.category,
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      completed: false,
    };
    
    try {
      const updatedSchedule = await scheduleService.updateSchedule(
        scheduleService.formatDateForAPI(selectedDate),
        [...schedule, newBlock]
      );
      setSchedule(updatedSchedule.blocks);
      setScheduleId(updatedSchedule._id);
      setShowAddModal(false);
      setNewTask({
        title: '',
        category: 'personal',
        startTime: '09:00',
        endTime: '10:00',
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (activeView !== 'day') {
      setActiveView('day');
    }
  };

  const renderDailyView = () => {
    const isInitialLoad = loading && !schedule.length;

    if (isInitialLoad) {
      return <ScheduleSkeleton />;
    }

    return (
      <Animated.View
        style={[
          styles.dailyView,
          {
            transform: [
              {
                translateX: swipeAnimation.interpolate({
                  inputRange: [-screenWidth, 0, screenWidth],
                  outputRange: [-20, 0, 20],
                }),
              },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{schedule.length}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {schedule.filter(item => item.completed).length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.scheduleList}>
            {schedule.length === 0 ? (
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
              schedule.map((item) => (
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
                      {item.startTime}
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
      </Animated.View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your schedule</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        
        <ScheduleViewSwitcher
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        {activeView === 'day' && (
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.date}>{formatDateShort(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {activeView === 'day' && renderDailyView()}
      {activeView === 'week' && (
        <ScheduleWeeklyView
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      )}
      {activeView === 'month' && (
        <ScheduleMonthlyView
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      )}

      {activeView === 'day' && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { backgroundColor: 'red', color: 'white' }]}>
              🚨 RECURRING TASKS COMING! 🚨
            </Text>
            
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
            
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newTask.startTime}
                  onChangeText={(text) => setNewTask({ ...newTask, startTime: text })}
                />
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newTask.endTime}
                  onChangeText={(text) => setNewTask({ ...newTask, endTime: text })}
                />
              </View>
            </View>
            
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
    marginTop: 8,
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
  dailyView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
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
});