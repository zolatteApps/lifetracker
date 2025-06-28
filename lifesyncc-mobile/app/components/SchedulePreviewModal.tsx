import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TagSelector } from './TagSelector';

interface ScheduleSession {
  activity: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  daysPerWeek: number;
  time: string;
  duration: number;
  days: string[];
  totalOccurrences: number;
  interval?: number; // For daily frequency: every N days
  monthDay?: number; // For monthly frequency: day of the month (1-31)
  endDate?: string; // Optional end date for the task
  tags?: string[]; // Tags for the task
  repeat?: boolean; // Whether the task repeats or is one-time
  date?: string; // Specific date for one-time tasks
}

interface SchedulePreviewModalProps {
  visible: boolean;
  goalDetails: {
    title: string;
    category: string;
    description: string;
    type?: 'milestone' | 'numeric' | 'habit';
    priority?: 'high' | 'medium' | 'low';
    targetValue?: number;
    unit?: string;
    proposedSchedule?: {
      summary: string;
      explanation: string;
      sessions: ScheduleSession[];
    };
    isManualMode?: boolean;
  } | null;
  onAccept: (updatedDetails?: any) => void;
  onModify: () => void;
  onCancel: () => void;
  onUpdate?: (updatedDetails: any) => void;
  loading?: boolean;
}

const categoryIcons: Record<string, string> = {
  physical: 'fitness',
  mental: 'library',
  financial: 'cash',
  social: 'people',
};

const categoryColors: Record<string, string> = {
  physical: '#10B981',
  mental: '#8B5CF6',
  financial: '#F59E0B',
  social: '#3B82F6',
};

const categories = [
  { key: 'physical', label: 'Physical' },
  { key: 'mental', label: 'Mental' },
  { key: 'financial', label: 'Financial' },
  { key: 'social', label: 'Social' },
];

export const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({
  visible,
  goalDetails,
  onAccept,
  onModify,
  onCancel,
  onUpdate,
  loading = false,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState<any>(null);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<ScheduleSession>({
    activity: '',
    frequency: 'weekly',
    daysPerWeek: 3,
    time: '09:00',
    duration: 60,
    days: ['Mon', 'Wed', 'Fri'],
    totalOccurrences: 36,
    tags: [],
    repeat: true,
    date: new Date().toISOString(),
  });
  const [showEndDatePicker, setShowEndDatePicker] = useState<number | null>(null);
  const [showTagSelector, setShowTagSelector] = useState<number | null>(null);
  const [showTaskDatePicker, setShowTaskDatePicker] = useState<number | null>(null);
  const [showNewTaskDatePicker, setShowNewTaskDatePicker] = useState(false);
  const [scheduleStartDate] = useState(new Date());
  const [scheduleEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 84); // 12 weeks
    return date;
  });

  useEffect(() => {
    if (goalDetails && visible) {
      setEditedDetails(JSON.parse(JSON.stringify(goalDetails)));
      // Automatically open in edit mode for manual creation
      if (goalDetails.isManualMode) {
        setIsEditMode(true);
      }
    } else {
      // Reset edit mode when modal is closed
      setIsEditMode(false);
    }
  }, [goalDetails, visible]);


  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const predefinedTags = {
    priority: ['High Priority', 'Medium Priority', 'Low Priority'],
    difficulty: ['Easy', 'Medium', 'Hard'],
    location: ['Home', 'Gym', 'Outdoor', 'Office'],
    type: ['Cardio', 'Strength', 'Flexibility', 'Mental', 'Study'],
  };

  const getTagColor = (tag: string) => {
    if (tag.includes('High')) return '#EF4444';
    if (tag.includes('Medium')) return '#F59E0B';
    if (tag.includes('Low')) return '#10B981';
    if (tag.includes('Easy')) return '#10B981';
    if (tag.includes('Hard')) return '#EF4444';
    if (tag.includes('Cardio')) return '#3B82F6';
    if (tag.includes('Strength')) return '#8B5CF6';
    return '#6B7280';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatFrequency = (session: ScheduleSession) => {
    if (!session.repeat) {
      return session.date ? `One-time on ${formatDate(new Date(session.date))}` : 'One-time';
    }
    if (session.frequency === 'daily') {
      const interval = session.interval || 1;
      return interval === 1 ? 'Every day' : `Every ${interval} days`;
    }
    if (session.frequency === 'weekly') {
      return `Weekly on ${session.days.join(', ')}`;
    }
    if (session.frequency === 'monthly') {
      const day = session.monthDay || 1;
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `Monthly on the ${day}${suffix}`;
    }
    return 'Monthly';
  };

  const generateScheduleSummary = (sessions: ScheduleSession[]) => {
    if (sessions.length === 0) return 'No sessions scheduled';
    
    const session = sessions[0]; // Assuming single session for now
    const totalWeeks = Math.ceil(session.totalOccurrences / (session.daysPerWeek || 1));
    
    if (session.frequency === 'daily') {
      const interval = session.interval || 1;
      if (interval === 1) {
        return `${session.activity} every day for ${totalWeeks} weeks`;
      } else {
        return `${session.activity} every ${interval} days`;
      }
    } else if (session.frequency === 'weekly') {
      const sessionsPerWeek = session.days.length;
      return `${sessionsPerWeek} ${session.activity.toLowerCase()} sessions per week for ${totalWeeks} weeks`;
    } else if (session.frequency === 'monthly') {
      return `${session.activity} once per month for ${session.totalOccurrences} months`;
    }
    
    return proposedSchedule.summary;
  };

  const calculateTotalSessions = (
    frequency: string,
    startDate: Date,
    endDate: Date,
    interval: number = 1,
    selectedDays: string[] = [],
    monthDay?: number
  ) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
    
    if (frequency === 'daily') {
      // For daily frequency, count based on interval
      return Math.floor(totalDays / interval);
    } else if (frequency === 'weekly') {
      // For weekly frequency, count occurrences of selected days
      let count = 0;
      const currentDate = new Date(startDate);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      while (currentDate <= endDate) {
        const dayName = dayNames[currentDate.getDay()];
        if (selectedDays.includes(dayName)) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return count;
    } else if (frequency === 'monthly') {
      // For monthly frequency, count occurrences on specific day of month
      let count = 0;
      const currentDate = new Date(startDate);
      const targetDay = monthDay || 1;
      
      while (currentDate <= endDate) {
        if (currentDate.getDate() === targetDay) {
          count++;
        }
        // Move to next month's target day
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(targetDay);
      }
      
      return count;
    }
    
    return 0;
  };

  const validateSchedule = () => {
    for (const session of editedDetails.proposedSchedule.sessions) {
      if (session.frequency === 'weekly' && session.days.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one day for weekly sessions');
        return false;
      }
      if (session.frequency === 'daily' && (!session.interval || session.interval < 1)) {
        Alert.alert('Validation Error', 'Please enter a valid interval for daily sessions');
        return false;
      }
      if (session.frequency === 'monthly' && (!session.monthDay || session.monthDay < 1 || session.monthDay > 31)) {
        Alert.alert('Validation Error', 'Please enter a valid day of month (1-31)');
        return false;
      }
      if (!session.activity || session.activity.trim() === '') {
        Alert.alert('Validation Error', 'Please enter an activity name');
        return false;
      }
      if (!session.duration || session.duration < 1) {
        Alert.alert('Validation Error', 'Please enter a valid duration');
        return false;
      }
      // Validate task end date is not after schedule end date
      if (session.endDate) {
        const taskEndDate = new Date(session.endDate);
        if (taskEndDate > scheduleEndDate) {
          Alert.alert('Validation Error', 'Task end date cannot be after the schedule end date');
          return false;
        }
        if (taskEndDate < scheduleStartDate) {
          Alert.alert('Validation Error', 'Task end date cannot be before today');
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveChanges = () => {
    if (!validateSchedule()) {
      return;
    }
    
    // Add schedule dates to the details
    const updatedDetails = {
      ...editedDetails,
      scheduleStartDate: scheduleStartDate,
      scheduleEndDate: scheduleEndDate
    };
    
    // Close modal and let parent handle success
    if (goalDetails?.isManualMode) {
      // For manual mode (creating a new goal), use onAccept
      onAccept(updatedDetails);
    } else {
      // For editing existing goal, use onUpdate
      if (onUpdate) {
        onUpdate(updatedDetails);
      }
      // Close the modal
      onCancel();
    }
  };

  const handleCancelEdit = () => {
    setEditedDetails(JSON.parse(JSON.stringify(goalDetails)));
    setIsEditMode(false);
  };

  const toggleDay = (sessionIndex: number, day: string) => {
    const newDetails = { ...editedDetails };
    const session = newDetails.proposedSchedule.sessions[sessionIndex];
    
    if (session.days.includes(day)) {
      session.days = session.days.filter((d: string) => d !== day);
    } else {
      session.days.push(day);
    }
    
    // Update daysPerWeek based on selected days
    session.daysPerWeek = session.days.length;
    
    // Recalculate total sessions based on actual dates
    const sessionEndDate = session.endDate ? new Date(session.endDate) : scheduleEndDate;
    session.totalOccurrences = calculateTotalSessions(
      'weekly',
      scheduleStartDate,
      sessionEndDate,
      1,
      session.days
    );
    
    setEditedDetails(newDetails);
  };

  const updateSessionTime = (sessionIndex: number, date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const newDetails = { ...editedDetails };
    newDetails.proposedSchedule.sessions[sessionIndex].time = `${hours}:${minutes}`;
    setEditedDetails(newDetails);
    setShowTimePicker(null);
  };

  const deleteTask = (sessionIndex: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newDetails = { ...editedDetails };
            newDetails.proposedSchedule.sessions.splice(sessionIndex, 1);
            setEditedDetails(newDetails);
          },
        },
      ]
    );
  };

  const addNewTask = () => {
    if (!newTask.activity.trim()) {
      Alert.alert('Error', 'Please enter an activity name');
      return;
    }
    
    const newDetails = { ...editedDetails };
    newDetails.proposedSchedule.sessions.push({ ...newTask });
    setEditedDetails(newDetails);
    setShowAddTask(false);
    
    // Reset new task form
    setNewTask({
      activity: '',
      frequency: 'weekly',
      daysPerWeek: 3,
      time: '09:00',
      duration: 60,
      days: ['Mon', 'Wed', 'Fri'],
      totalOccurrences: 36,
      tags: [],
      repeat: true,
      date: new Date().toISOString(),
    });
  };

  const toggleTag = (sessionIndex: number, tag: string) => {
    const newDetails = { ...editedDetails };
    const session = newDetails.proposedSchedule.sessions[sessionIndex];
    
    if (!session.tags) session.tags = [];
    
    const tagIndex = session.tags.indexOf(tag);
    if (tagIndex > -1) {
      session.tags.splice(tagIndex, 1);
    } else {
      session.tags.push(tag);
    }
    
    setEditedDetails(newDetails);
  };

  if (!goalDetails || !goalDetails.proposedSchedule || !editedDetails) {
    return null;
  }

  const { proposedSchedule } = editedDetails;
  const categoryColor = categoryColors[editedDetails.category] || '#4F46E5';
  const categoryIcon = categoryIcons[editedDetails.category] || 'flag';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditMode ? 'Edit Goal & Schedule' : 'Goal & Schedule Preview'}
            </Text>
            <TouchableOpacity 
              onPress={onCancel} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Goal Summary */}
            <View style={[styles.goalCard, { borderLeftColor: categoryColor }]}>
              <View style={styles.goalHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
                  <Ionicons name={categoryIcon as any} size={24} color={categoryColor} />
                </View>
                <View style={styles.goalInfo}>
                  {isEditMode ? (
                    <>
                      <TextInput
                        style={styles.goalTitleInput}
                        value={editedDetails.title}
                        onChangeText={(text) => setEditedDetails({ ...editedDetails, title: text })}
                        placeholder="Goal title"
                      />
                      <View style={styles.categoryPickerContainer}>
                        <Picker
                          selectedValue={editedDetails.category}
                          onValueChange={(value) => setEditedDetails({ ...editedDetails, category: value })}
                          style={styles.categoryPicker}
                        >
                          {categories.map((cat) => (
                            <Picker.Item key={cat.key} label={cat.label} value={cat.key} />
                          ))}
                        </Picker>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.goalTitle}>{editedDetails.title}</Text>
                      <Text style={styles.goalCategory}>
                        {editedDetails.category.charAt(0).toUpperCase() + editedDetails.category.slice(1)} Goal
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {isEditMode ? (
                <TextInput
                  style={styles.goalDescriptionInput}
                  value={editedDetails.description}
                  onChangeText={(text) => setEditedDetails({ ...editedDetails, description: text })}
                  placeholder="Goal description"
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.goalDescription}>{editedDetails.description}</Text>
              )}
            </View>

            {/* Proposed Schedule */}
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleTitleContainer}>
                <Text style={styles.sectionTitle}>Proposed Schedule</Text>
                <View style={styles.dateRangeContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.dateRangeText}>
                    {formatDate(scheduleStartDate)} - {formatDate(scheduleEndDate)}
                  </Text>
                  <Text style={styles.durationText}>
                    ({Math.round((scheduleEndDate.getTime() - scheduleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks)
                  </Text>
                </View>
              </View>
              <Text style={styles.scheduleSummary}>
                {isEditMode ? generateScheduleSummary(proposedSchedule.sessions) : proposedSchedule.summary}
              </Text>

              {proposedSchedule.sessions.map((session: ScheduleSession, index: number) => (
                <View key={index} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleRow}>
                      <Ionicons name="calendar-outline" size={20} color={categoryColor} />
                      {isEditMode ? (
                        <TextInput
                          style={styles.sessionActivityInput}
                          value={session.activity}
                          onChangeText={(text) => {
                            const newDetails = { ...editedDetails };
                            newDetails.proposedSchedule.sessions[index].activity = text;
                            setEditedDetails(newDetails);
                          }}
                          placeholder="Activity name"
                        />
                      ) : (
                        <Text style={styles.sessionActivity}>{session.activity}</Text>
                      )}
                    </View>
                    {isEditMode && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteTask(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Tags Section */}
                  {(session.tags && session.tags.length > 0) || isEditMode ? (
                    <View style={styles.tagsContainer}>
                      {session.tags?.map((tag, tagIndex) => (
                        <TouchableOpacity
                          key={tagIndex}
                          style={[styles.tag, { backgroundColor: `${getTagColor(tag)}20` }]}
                          onPress={() => isEditMode && toggleTag(index, tag)}
                          disabled={!isEditMode}
                        >
                          <Text style={[styles.tagText, { color: getTagColor(tag) }]}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.addTagButton}
                          onPress={() => setShowTagSelector(index)}
                        >
                          <Ionicons name="add" size={16} color="#6B7280" />
                          <Text style={styles.addTagText}>Add Tag</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : null}
                  
                  <View style={styles.sessionDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      {isEditMode ? (
                        <View style={styles.timeEditContainer}>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker(index)}
                          >
                            <Text style={styles.detailText}>
                              {formatTime(session.time)}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.detailText}> • </Text>
                          <TextInput
                            style={styles.durationInput}
                            value={session.duration.toString()}
                            onChangeText={(text) => {
                              const newDetails = { ...editedDetails };
                              newDetails.proposedSchedule.sessions[index].duration = parseInt(text) || 0;
                              setEditedDetails(newDetails);
                            }}
                            keyboardType="numeric"
                            placeholder="Duration"
                          />
                          <Text style={styles.detailText}> min</Text>
                        </View>
                      ) : (
                        <Text style={styles.detailText}>
                          {formatTime(session.time)} • {formatDuration(session.duration)}
                        </Text>
                      )}
                    </View>
                    
                    {/* Repeat Toggle for existing tasks */}
                    {isEditMode && (
                      <View style={styles.detailRow}>
                        <Ionicons name="sync-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>Repeat</Text>
                        <Switch
                          value={session.repeat !== false}
                          onValueChange={(value) => {
                            const newDetails = { ...editedDetails };
                            const updatedSession = newDetails.proposedSchedule.sessions[index];
                            updatedSession.repeat = value;
                            
                            if (!value) {
                              // Converting to one-time task
                              updatedSession.date = updatedSession.date || new Date().toISOString();
                              updatedSession.totalOccurrences = 1;
                              Alert.alert(
                                'Convert to One-time Task',
                                'This will keep only the next occurrence. Continue?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { 
                                    text: 'Continue', 
                                    onPress: () => setEditedDetails(newDetails)
                                  }
                                ]
                              );
                            } else {
                              // Converting to recurring task
                              updatedSession.frequency = 'weekly';
                              updatedSession.days = ['Mon', 'Wed', 'Fri'];
                              updatedSession.daysPerWeek = 3;
                              const sessionEndDate = updatedSession.endDate ? new Date(updatedSession.endDate) : scheduleEndDate;
                              updatedSession.totalOccurrences = calculateTotalSessions(
                                'weekly',
                                scheduleStartDate,
                                sessionEndDate,
                                1,
                                updatedSession.days
                              );
                              setEditedDetails(newDetails);
                            }
                          }}
                          trackColor={{ false: '#E5E7EB', true: `${categoryColor}40` }}
                          thumbColor={session.repeat !== false ? categoryColor : '#9CA3AF'}
                          style={styles.repeatSwitch}
                        />
                      </View>
                    )}
                    
                    {/* Frequency/Date Row */}
                    <View style={styles.detailRow}>
                      <Ionicons name="repeat-outline" size={16} color="#666" />
                      {isEditMode && session.repeat !== false ? (
                        <View style={styles.frequencyEditContainer}>
                          <Picker
                            selectedValue={session.frequency}
                            onValueChange={(value) => {
                              const newDetails = { ...editedDetails };
                              const session = newDetails.proposedSchedule.sessions[index];
                              session.frequency = value;
                              
                              // Reset frequency-specific data when changing frequency
                              const sessionEndDate = session.endDate ? new Date(session.endDate) : scheduleEndDate;
                              
                              if (value === 'daily') {
                                session.interval = 1;
                                session.days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                session.daysPerWeek = 7;
                                session.totalOccurrences = calculateTotalSessions(
                                  'daily',
                                  scheduleStartDate,
                                  sessionEndDate,
                                  1,
                                  session.days
                                );
                              } else if (value === 'weekly') {
                                session.days = session.days.length > 0 ? session.days : ['Mon', 'Wed', 'Fri'];
                                session.daysPerWeek = session.days.length;
                                session.totalOccurrences = calculateTotalSessions(
                                  'weekly',
                                  scheduleStartDate,
                                  sessionEndDate,
                                  1,
                                  session.days
                                );
                              } else if (value === 'monthly') {
                                session.monthDay = 1;
                                session.days = [];
                                session.daysPerWeek = 0;
                                session.totalOccurrences = calculateTotalSessions(
                                  'monthly',
                                  scheduleStartDate,
                                  sessionEndDate,
                                  1,
                                  [],
                                  1
                                );
                              }
                              
                              setEditedDetails(newDetails);
                            }}
                            style={styles.frequencyPicker}
                          >
                            <Picker.Item label="Daily" value="daily" />
                            <Picker.Item label="Weekly" value="weekly" />
                            <Picker.Item label="Monthly" value="monthly" />
                          </Picker>
                        </View>
                      ) : isEditMode && session.repeat === false ? (
                        <TouchableOpacity
                          style={styles.dateButton}
                          onPress={() => setShowTaskDatePicker(index)}
                        >
                          <Text style={styles.detailText}>
                            {session.date ? formatDate(new Date(session.date)) : 'Select date'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.detailText}>{formatFrequency(session)}</Text>
                      )}
                    </View>
                    
                    {/* Frequency-specific UI */}
                    {session.repeat !== false && session.frequency === 'weekly' && (
                      <View style={styles.daysContainer}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <TouchableOpacity
                            key={day}
                            onPress={() => isEditMode && toggleDay(index, day)}
                            disabled={!isEditMode}
                            style={[
                              styles.dayBadge,
                              session.days.includes(day) && styles.dayBadgeActive,
                              session.days.includes(day) && { backgroundColor: categoryColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                session.days.includes(day) && styles.dayTextActive,
                              ]}
                            >
                              {day.charAt(0)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {session.repeat !== false && session.frequency === 'daily' && isEditMode && (
                      <View style={styles.dailyFrequencyContainer}>
                        <Text style={styles.detailText}>Every </Text>
                        <TextInput
                          style={styles.dailyIntervalInput}
                          value={(session.interval || 1).toString()}
                          onChangeText={(text) => {
                            const newDetails = { ...editedDetails };
                            const interval = parseInt(text) || 1;
                            newDetails.proposedSchedule.sessions[index].interval = interval;
                            const sessionEndDate = newDetails.proposedSchedule.sessions[index].endDate 
                              ? new Date(newDetails.proposedSchedule.sessions[index].endDate) 
                              : scheduleEndDate;
                            newDetails.proposedSchedule.sessions[index].totalOccurrences = calculateTotalSessions(
                              'daily',
                              scheduleStartDate,
                              sessionEndDate,
                              interval,
                              newDetails.proposedSchedule.sessions[index].days
                            );
                            setEditedDetails(newDetails);
                          }}
                          keyboardType="numeric"
                          placeholder="1"
                        />
                        <Text style={styles.detailText}> day(s)</Text>
                      </View>
                    )}
                    
                    {session.repeat !== false && session.frequency === 'monthly' && isEditMode && (
                      <View style={styles.monthlyFrequencyContainer}>
                        <Text style={styles.detailText}>Day </Text>
                        <TextInput
                          style={styles.monthlyDayInput}
                          value={(session.monthDay || 1).toString()}
                          onChangeText={(text) => {
                            const day = parseInt(text) || 1;
                            if (day >= 1 && day <= 31) {
                              const newDetails = { ...editedDetails };
                              newDetails.proposedSchedule.sessions[index].monthDay = day;
                              setEditedDetails(newDetails);
                            }
                          }}
                          keyboardType="numeric"
                          placeholder="1"
                        />
                        <Text style={styles.detailText}> of each month</Text>
                      </View>
                    )}
                    
                    {/* End Date Section */}
                    {isEditMode && (
                      <View style={styles.endDateContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>End by: </Text>
                        {session.endDate ? (
                          <TouchableOpacity
                            style={styles.endDateButton}
                            onPress={() => setShowEndDatePicker(index)}
                          >
                            <Text style={styles.endDateText}>
                              {formatDate(new Date(session.endDate))}
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                const newDetails = { ...editedDetails };
                                newDetails.proposedSchedule.sessions[index].endDate = undefined;
                                setEditedDetails(newDetails);
                              }}
                            >
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.addEndDateButton}
                            onPress={() => setShowEndDatePicker(index)}
                          >
                            <Ionicons name="add-circle-outline" size={16} color="#6B7280" />
                            <Text style={styles.addEndDateText}>Set end date</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    
                    {!isEditMode && session.endDate && (
                      <View style={styles.endDateContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          Ends: {formatDate(new Date(session.endDate))}
                        </Text>
                      </View>
                    )}
                    
                    {/* Only show total for recurring tasks */}
                    {session.repeat !== false && (
                      <View style={styles.totalRow}>
                        {isEditMode ? (
                          <View style={styles.totalEditContainer}>
                            <Text style={styles.totalText}>Total: </Text>
                            <TextInput
                              style={styles.totalInput}
                              value={session.totalOccurrences.toString()}
                              onChangeText={(text) => {
                                const newDetails = { ...editedDetails };
                                newDetails.proposedSchedule.sessions[index].totalOccurrences = parseInt(text) || 0;
                                setEditedDetails(newDetails);
                              }}
                              keyboardType="numeric"
                            />
                            <Text style={styles.totalText}> sessions</Text>
                          </View>
                        ) : (
                          <Text style={styles.totalText}>
                            Total: {session.totalOccurrences} sessions
                            {session.frequency === 'weekly' && (() => {
                              const endDate = session.endDate ? new Date(session.endDate) : scheduleEndDate;
                              const weeks = Math.ceil((endDate.getTime() - scheduleStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                              return (
                                <Text style={styles.calculationBreakdown}>
                                  {' '}({weeks} weeks × {session.days.length} days/week)
                                </Text>
                              );
                            })()}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {/* Show badge for one-time tasks */}
                    {session.repeat === false && !isEditMode && (
                      <View style={styles.oneTimeBadgeContainer}>
                        <View style={[styles.oneTimeBadge, { backgroundColor: `${categoryColor}20` }]}>
                          <Ionicons name="time-outline" size={12} color={categoryColor} />
                          <Text style={[styles.oneTimeBadgeText, { color: categoryColor }]}>One-time</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Add Task Button */}
              {isEditMode && !showAddTask && (
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => setShowAddTask(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={categoryColor} />
                  <Text style={[styles.addTaskButtonText, { color: categoryColor }]}>
                    Add Task
                  </Text>
                </TouchableOpacity>
              )}

              {/* Add Task Form */}
              {showAddTask && (
                <View style={styles.addTaskForm}>
                  <Text style={styles.addTaskTitle}>New Task</Text>
                  <TextInput
                    style={styles.addTaskInput}
                    placeholder="Activity name"
                    value={newTask.activity}
                    onChangeText={(text) => setNewTask({ ...newTask, activity: text })}
                  />
                  
                  <View style={styles.addTaskRow}>
                    <View style={styles.addTaskField}>
                      <Text style={styles.addTaskLabel}>Time</Text>
                      <TouchableOpacity
                        style={styles.addTaskTimeButton}
                        onPress={() => {
                          // Time picker for new task
                          Alert.alert('Time Picker', 'Time picker would appear here');
                        }}
                      >
                        <Text>{formatTime(newTask.time)}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.addTaskField}>
                      <Text style={styles.addTaskLabel}>Duration</Text>
                      <TextInput
                        style={styles.addTaskDurationInput}
                        value={newTask.duration.toString()}
                        onChangeText={(text) => setNewTask({ ...newTask, duration: parseInt(text) || 60 })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  {/* Repeat Toggle */}
                  <View style={styles.repeatToggleContainer}>
                    <Text style={styles.repeatToggleLabel}>Repeat</Text>
                    <Switch
                      value={newTask.repeat}
                      onValueChange={(value) => {
                        const updated = { ...newTask, repeat: value };
                        if (value) {
                          // Switching to repeat mode - set default frequency values
                          updated.frequency = 'weekly';
                          updated.days = ['Mon', 'Wed', 'Fri'];
                          updated.daysPerWeek = 3;
                          updated.totalOccurrences = calculateTotalSessions(
                            'weekly',
                            scheduleStartDate,
                            scheduleEndDate,
                            1,
                            ['Mon', 'Wed', 'Fri']
                          );
                        } else {
                          // Switching to one-time - set date to today
                          updated.date = new Date().toISOString();
                          updated.totalOccurrences = 1;
                        }
                        setNewTask(updated);
                      }}
                      trackColor={{ false: '#E5E7EB', true: `${categoryColor}40` }}
                      thumbColor={newTask.repeat ? categoryColor : '#9CA3AF'}
                    />
                  </View>
                  
                  {/* Conditional UI based on repeat toggle */}
                  {newTask.repeat ? (
                    <>
                      {/* Frequency Selector */}
                      <View style={styles.frequencyContainer}>
                        <Text style={styles.addTaskLabel}>Frequency</Text>
                        <View style={styles.frequencyPickerContainer}>
                          <Picker
                            selectedValue={newTask.frequency}
                            onValueChange={(value) => {
                              const updated = { ...newTask, frequency: value };
                              if (value === 'daily') {
                                updated.interval = 1;
                                updated.days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                updated.daysPerWeek = 7;
                                updated.totalOccurrences = calculateTotalSessions(
                                  'daily',
                                  scheduleStartDate,
                                  scheduleEndDate,
                                  1,
                                  updated.days
                                );
                              } else if (value === 'weekly') {
                                updated.days = ['Mon', 'Wed', 'Fri'];
                                updated.daysPerWeek = 3;
                                updated.totalOccurrences = calculateTotalSessions(
                                  'weekly',
                                  scheduleStartDate,
                                  scheduleEndDate,
                                  1,
                                  updated.days
                                );
                              } else if (value === 'monthly') {
                                updated.monthDay = 1;
                                updated.days = [];
                                updated.daysPerWeek = 0;
                                updated.totalOccurrences = calculateTotalSessions(
                                  'monthly',
                                  scheduleStartDate,
                                  scheduleEndDate,
                                  1,
                                  [],
                                  1
                                );
                              }
                              setNewTask(updated);
                            }}
                            style={styles.frequencyPicker}
                          >
                            <Picker.Item label="Daily" value="daily" />
                            <Picker.Item label="Weekly" value="weekly" />
                            <Picker.Item label="Monthly" value="monthly" />
                          </Picker>
                        </View>
                      </View>
                      
                      {/* Frequency-specific options */}
                      {newTask.frequency === 'daily' && (
                        <View style={styles.dailyFrequencyContainer}>
                          <Text style={styles.detailText}>Every </Text>
                          <TextInput
                            style={styles.dailyIntervalInput}
                            value={(newTask.interval || 1).toString()}
                            onChangeText={(text) => {
                              const interval = parseInt(text) || 1;
                              const updated = { ...newTask, interval };
                              updated.totalOccurrences = calculateTotalSessions('daily', 12, interval, 7);
                              setNewTask(updated);
                            }}
                            keyboardType="numeric"
                            placeholder="1"
                          />
                          <Text style={styles.detailText}> day(s)</Text>
                        </View>
                      )}
                      
                      {newTask.frequency === 'weekly' && (
                        <View style={styles.daysContainer}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <TouchableOpacity
                              key={day}
                              onPress={() => {
                                const updated = { ...newTask };
                                if (updated.days.includes(day)) {
                                  updated.days = updated.days.filter(d => d !== day);
                                } else {
                                  updated.days.push(day);
                                }
                                updated.daysPerWeek = updated.days.length;
                                updated.totalOccurrences = calculateTotalSessions('weekly', 12, 1, updated.days.length);
                                setNewTask(updated);
                              }}
                              style={[
                                styles.dayBadge,
                                newTask.days.includes(day) && styles.dayBadgeActive,
                                newTask.days.includes(day) && { backgroundColor: categoryColor },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  newTask.days.includes(day) && styles.dayTextActive,
                                ]}
                              >
                                {day.charAt(0)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      
                      {newTask.frequency === 'monthly' && (
                        <View style={styles.monthlyFrequencyContainer}>
                          <Text style={styles.detailText}>Day </Text>
                          <TextInput
                            style={styles.monthlyDayInput}
                            value={(newTask.monthDay || 1).toString()}
                            onChangeText={(text) => {
                              const day = parseInt(text) || 1;
                              if (day >= 1 && day <= 31) {
                                const updated = { ...newTask, monthDay: day };
                                updated.totalOccurrences = calculateTotalSessions('monthly', 12, 1, 0);
                                setNewTask(updated);
                              }
                            }}
                            keyboardType="numeric"
                            placeholder="1"
                          />
                          <Text style={styles.detailText}> of each month</Text>
                        </View>
                      )}
                      
                      {/* Tags Section */}
                      <View style={styles.addTaskTagsContainer}>
                        <Text style={styles.addTaskLabel}>Tags</Text>
                        <View style={styles.tagsContainer}>
                          {newTask.tags?.map((tag, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[styles.tag, { backgroundColor: `${getTagColor(tag)}20` }]}
                              onPress={() => {
                                const updated = { ...newTask };
                                updated.tags = updated.tags?.filter((_, i) => i !== index);
                                setNewTask(updated);
                              }}
                            >
                              <Text style={[styles.tagText, { color: getTagColor(tag) }]}>{tag}</Text>
                              <Ionicons name="close-circle" size={16} color={getTagColor(tag)} />
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity
                            style={styles.addTagButton}
                            onPress={() => {
                              // For now, cycle through some predefined tags
                              const availableTags = ['High Priority', 'Cardio', 'Home', 'Easy'];
                              const currentTags = newTask.tags || [];
                              const nextTag = availableTags.find(tag => !currentTags.includes(tag));
                              if (nextTag) {
                                setNewTask({ ...newTask, tags: [...currentTags, nextTag] });
                              }
                            }}
                          >
                            <Ionicons name="add" size={16} color="#6B7280" />
                            <Text style={styles.addTagText}>Add Tag</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* End Date Section */}
                      <View style={styles.addTaskEndDateContainer}>
                        <Text style={styles.addTaskLabel}>End by (optional)</Text>
                        {newTask.endDate ? (
                          <TouchableOpacity
                            style={styles.endDateButton}
                            onPress={() => setShowEndDatePicker(-1)} // -1 for new task
                          >
                            <Text style={styles.endDateText}>
                              {formatDate(new Date(newTask.endDate))}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setNewTask({ ...newTask, endDate: undefined })}
                            >
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.addEndDateButton}
                            onPress={() => setShowEndDatePicker(-1)} // -1 for new task
                          >
                            <Ionicons name="add-circle-outline" size={16} color="#6B7280" />
                            <Text style={styles.addEndDateText}>Set end date</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {/* Total Sessions */}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalText}>
                          Total: {newTask.totalOccurrences} sessions
                        </Text>
                      </View>
                    </>
                  ) : (
                    /* One-time task date picker */
                    <View style={styles.oneTimeDateContainer}>
                      <Text style={styles.addTaskLabel}>Date</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowNewTaskDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        <Text style={styles.datePickerText}>
                          {newTask.date ? formatDate(new Date(newTask.date)) : 'Select date'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.addTaskActions}>
                    <TouchableOpacity
                      style={styles.addTaskCancelButton}
                      onPress={() => {
                        setShowAddTask(false);
                        setNewTask({
                          activity: '',
                          frequency: 'weekly',
                          daysPerWeek: 3,
                          time: '09:00',
                          duration: 60,
                          days: ['Mon', 'Wed', 'Fri'],
                          totalOccurrences: 36,
                          tags: [],
                          repeat: true,
                          date: new Date().toISOString(),
                        });
                      }}
                    >
                      <Text style={styles.addTaskCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.addTaskSaveButton, { backgroundColor: categoryColor }]}
                      onPress={addNewTask}
                    >
                      <Text style={styles.addTaskSaveText}>Add Task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Explanation */}
              <View style={styles.explanationCard}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                  <Text style={styles.explanationTitle}>Why this schedule?</Text>
                </View>
                <Text style={styles.explanationText}>{proposedSchedule.explanation}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isEditMode ? (
              <>
                <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelEdit}>
                  <Ionicons name="close-outline" size={20} color="#666" />
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: categoryColor }]}
                  onPress={handleSaveChanges}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => Alert.alert('Calendar Preview', 'Coming soon')}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modifyButton} 
                  onPress={() => setIsEditMode(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#4F46E5" />
                  <Text style={styles.modifyButtonText}>Modify</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.acceptButton, { backgroundColor: categoryColor }]}
                  onPress={onAccept}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept & Create</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker !== null && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = editedDetails.proposedSchedule.sessions[showTimePicker].time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours));
            date.setMinutes(parseInt(minutes));
            return date;
          })()}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              updateSessionTime(showTimePicker, selectedDate);
            } else {
              setShowTimePicker(null);
            }
          }}
        />
      )}

      {/* End Date Picker Modal */}
      {showEndDatePicker !== null && (
        <DateTimePicker
          value={(() => {
            if (showEndDatePicker === -1) {
              // New task
              return newTask.endDate ? new Date(newTask.endDate) : new Date();
            } else {
              // Existing task
              const session = editedDetails.proposedSchedule.sessions[showEndDatePicker];
              return session.endDate ? new Date(session.endDate) : new Date();
            }
          })()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          maximumDate={scheduleEndDate}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              if (showEndDatePicker === -1) {
                // New task
                const updated = { ...newTask, endDate: selectedDate.toISOString() };
                // Recalculate sessions for new task
                if (updated.repeat) {
                  updated.totalOccurrences = calculateTotalSessions(
                    updated.frequency,
                    scheduleStartDate,
                    selectedDate,
                    updated.interval || 1,
                    updated.days,
                    updated.monthDay
                  );
                }
                setNewTask(updated);
              } else {
                // Existing task
                const newDetails = { ...editedDetails };
                const sessionIndex = showEndDatePicker;
                newDetails.proposedSchedule.sessions[sessionIndex].endDate = selectedDate.toISOString();
                
                // Recalculate total sessions when end date changes
                const session = newDetails.proposedSchedule.sessions[sessionIndex];
                if (session.repeat !== false) {
                  session.totalOccurrences = calculateTotalSessions(
                    session.frequency,
                    scheduleStartDate,
                    selectedDate,
                    session.interval || 1,
                    session.days,
                    session.monthDay
                  );
                }
                
                setEditedDetails(newDetails);
              }
            }
            setShowEndDatePicker(null);
          }}
        />
      )}

      {/* Tag Selector Modal */}
      {showTagSelector !== null && (
        <TagSelector
          visible={true}
          selectedTags={editedDetails.proposedSchedule.sessions[showTagSelector].tags || []}
          onClose={() => setShowTagSelector(null)}
          onSelectTags={(tags) => {
            const newDetails = { ...editedDetails };
            newDetails.proposedSchedule.sessions[showTagSelector].tags = tags;
            setEditedDetails(newDetails);
            setShowTagSelector(null);
          }}
          predefinedTags={predefinedTags}
        />
      )}

      {/* Date Picker for One-time Tasks */}
      {showTaskDatePicker !== null && (
        <DateTimePicker
          value={(() => {
            const session = editedDetails.proposedSchedule.sessions[showTaskDatePicker];
            return session.date ? new Date(session.date) : new Date();
          })()}
          mode="date"
          display="default"
          minimumDate={scheduleStartDate}
          maximumDate={scheduleEndDate}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              const newDetails = { ...editedDetails };
              newDetails.proposedSchedule.sessions[showTaskDatePicker].date = selectedDate.toISOString();
              setEditedDetails(newDetails);
            }
            setShowTaskDatePicker(null);
          }}
        />
      )}

      {/* Date Picker for New One-time Task */}
      {showNewTaskDatePicker && (
        <DateTimePicker
          value={newTask.date ? new Date(newTask.date) : new Date()}
          mode="date"
          display="default"
          minimumDate={scheduleStartDate}
          maximumDate={scheduleEndDate}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              setNewTask({ ...newTask, date: selectedDate.toISOString() });
            }
            setShowNewTaskDatePicker(false);
          }}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  goalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
    marginBottom: 8,
  },
  goalCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryPickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryPicker: {
    height: 50,
  },
  goalDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  goalDescriptionInput: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
  },
  scheduleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  scheduleSummary: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  sessionActivity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
  },
  sessionActivityInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
  },
  sessionDetails: {
    marginLeft: 28,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  timeEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  durationInput: {
    width: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 2,
    textAlign: 'center',
  },
  frequencyEditContainer: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  frequencyPicker: {
    height: 50,
  },
  daysContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dayBadgeActive: {
    backgroundColor: '#4F46E5',
  },
  dayText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#fff',
  },
  totalRow: {
    marginTop: 4,
  },
  totalText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  calculationBreakdown: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  totalEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalInput: {
    width: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 2,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  dailyFrequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  dailyIntervalInput: {
    width: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 2,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  monthlyFrequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  monthlyDayInput: {
    width: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 2,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  explanationCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  modifyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 6,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  cancelEditButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  cancelEditButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  scheduleTitleContainer: {
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  endDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 4,
  },
  endDateText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  addEndDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  addEndDateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addTaskButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  addTaskForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  addTaskInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  addTaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addTaskField: {
    flex: 1,
    marginHorizontal: 4,
  },
  addTaskLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addTaskTimeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addTaskDurationInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  addTaskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addTaskCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  addTaskCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addTaskSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  addTaskSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  previewButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  repeatToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  repeatToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  repeatSwitch: {
    marginLeft: 8,
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyPickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  oneTimeDateContainer: {
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  dateButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 2,
  },
  oneTimeBadgeContainer: {
    marginTop: 8,
  },
  oneTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  oneTimeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  addTaskTagsContainer: {
    marginBottom: 16,
  },
  addTaskEndDateContainer: {
    marginBottom: 16,
  },
});