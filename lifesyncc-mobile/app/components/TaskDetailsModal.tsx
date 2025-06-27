import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

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

interface TaskDetailsModalProps {
  visible: boolean;
  task: ScheduleBlock | null;
  onClose: () => void;
  onUpdate: (updatedTask: ScheduleBlock) => Promise<void>;
  onDelete: (taskId: string, occurrenceChoice?: 'single' | 'all') => Promise<void>;
  onToggleComplete: (task: ScheduleBlock) => Promise<void>;
}

const categories = [
  { key: 'physical', label: 'Physical', color: '#10B981' },
  { key: 'mental', label: 'Mental', color: '#8B5CF6' },
  { key: 'financial', label: 'Financial', color: '#F59E0B' },
  { key: 'social', label: 'Social', color: '#3B82F6' },
  { key: 'personal', label: 'Personal', color: '#EC4899' },
] as const;

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible,
  task,
  onClose,
  onUpdate,
  onDelete,
  onToggleComplete,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<ScheduleBlock | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOccurrenceChoice, setEditOccurrenceChoice] = useState<'single' | 'all' | null>(null);
  const [showOccurrenceDialog, setShowOccurrenceDialog] = useState(false);
  const [deleteOccurrenceChoice, setDeleteOccurrenceChoice] = useState<'single' | 'all' | null>(null);
  const [showDeleteOccurrenceDialog, setShowDeleteOccurrenceDialog] = useState(false);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'occurrences' | 'duration'>('duration');
  const [recurrenceDuration, setRecurrenceDuration] = useState<1 | 3 | 6 | 12>(3);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDatePickerValue, setEndDatePickerValue] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });

  useEffect(() => {
    if (task && visible) {
      console.log('📋 DEBUG TaskDetailsModal: Task received:', JSON.stringify(task, null, 2));
      console.log('📋 DEBUG: Task recurring?', task.recurring);
      console.log('📋 DEBUG: Task recurrenceRule?', task.recurrenceRule);
      console.log('📋 DEBUG: Task recurrenceId?', task.recurrenceId);
      
      setEditedTask({ 
        ...task,
        recurrenceRule: task.recurrenceRule || {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1], // Default to Monday
        }
      });
      setIsEditMode(false);
      setEditOccurrenceChoice(null);
      setShowOccurrenceDialog(false);
      
      // Set end type based on existing recurrence rule
      if (task.recurrenceRule?.endDate) {
        setRecurrenceEndType('date');
        setEndDatePickerValue(new Date(task.recurrenceRule.endDate));
      } else if (task.recurrenceRule?.endOccurrences) {
        setRecurrenceEndType('occurrences');
      } else {
        setRecurrenceEndType('duration');
        setRecurrenceDuration(3);
      }
    }
  }, [task, visible]);

  const categoryColor = categories.find(cat => cat.key === (editedTask?.category || task?.category))?.color || '#6B7280';

  const handleSave = async () => {
    if (!editedTask) return;

    console.log('💾 DEBUG handleSave: task.recurring =', task?.recurring);
    console.log('💾 DEBUG handleSave: editOccurrenceChoice =', editOccurrenceChoice);
    
    // If this is a recurring task and user hasn't chosen yet, show dialog
    if (task?.recurring && !editOccurrenceChoice) {
      console.log('💾 DEBUG: Should show occurrence dialog!');
      console.log('💾 DEBUG: Setting showOccurrenceDialog to true');
      setShowOccurrenceDialog(true);
      console.log('💾 DEBUG: showOccurrenceDialog state will be:', true);
      return;
    }

    setIsLoading(true);
    try {
      // Process end date based on selection
      let finalEditedTask = { ...editedTask };
      
      if (editedTask.recurring && editedTask.recurrenceRule) {
        // Clear both end conditions first
        finalEditedTask.recurrenceRule = {
          ...editedTask.recurrenceRule,
          endDate: undefined,
          endOccurrences: undefined
        };
        
        // Set the selected end condition
        switch (recurrenceEndType) {
          case 'date':
            finalEditedTask.recurrenceRule.endDate = endDatePickerValue;
            break;
          case 'occurrences':
            finalEditedTask.recurrenceRule.endOccurrences = editedTask.recurrenceRule.endOccurrences || 30;
            break;
          case 'duration':
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + recurrenceDuration);
            finalEditedTask.recurrenceRule.endDate = endDate;
            break;
        }
      }
      
      // Include edit occurrence choice in the update
      const updateData = {
        ...finalEditedTask,
        editOccurrenceChoice: editOccurrenceChoice || 'single'
      };
      await onUpdate(updateData);
      setIsEditMode(false);
      setEditOccurrenceChoice(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    
    console.log('🗑️ DEBUG handleDelete: task =', JSON.stringify(task, null, 2));
    console.log('🗑️ DEBUG handleDelete: task.recurring =', task.recurring);
    
    // If this is a recurring task, show occurrence choice dialog
    if (task.recurring) {
      console.log('🗑️ DEBUG: Should show delete occurrence dialog!');
      console.log('🗑️ DEBUG: Setting showDeleteOccurrenceDialog to true');
      setShowDeleteOccurrenceDialog(true);
      console.log('🗑️ DEBUG: showDeleteOccurrenceDialog state will be:', true);
      console.log('🗑️ DEBUG: Current state of showDeleteOccurrenceDialog before set:', showDeleteOccurrenceDialog);
    } else {
      console.log('🗑️ DEBUG: Showing regular delete dialog');
      // For non-recurring tasks, show simple confirmation
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);
              try {
                await onDelete(task.id);
                onClose();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete task');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteWithChoice = async (choice: 'single' | 'all') => {
    if (!task) return;
    
    setDeleteOccurrenceChoice(choice);
    setShowDeleteOccurrenceDialog(false);
    setIsDeleting(true);
    
    try {
      // Pass the choice along with the task ID
      await onDelete(task.id, choice);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    } finally {
      setIsDeleting(false);
      setDeleteOccurrenceChoice(null);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      await onToggleComplete(task);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const updateTime = (date: Date | undefined, isStartTime: boolean) => {
    if (!date || !editedTask) return;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    if (isStartTime) {
      setEditedTask({ ...editedTask, startTime: timeString });
      setShowStartTimePicker(false);
    } else {
      setEditedTask({ ...editedTask, endTime: timeString });
      setShowEndTimePicker(false);
    }
  };

  if (!task || !editedTask) return null;

  console.log('🎯 DEBUG: Component render - showOccurrenceDialog:', showOccurrenceDialog);
  console.log('🎯 DEBUG: Component render - showDeleteOccurrenceDialog:', showDeleteOccurrenceDialog);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditMode ? 'Edit Task' : 'Task Details'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Task</Text>
              {isEditMode ? (
                <TextInput
                  style={styles.input}
                  value={editedTask.title}
                  onChangeText={(text) => setEditedTask({ ...editedTask, title: text })}
                  placeholder="Task title"
                />
              ) : (
                <Text style={styles.value}>{task.title}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              {isEditMode ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editedTask.category}
                    onValueChange={(value) => setEditedTask({ ...editedTask, category: value })}
                    style={styles.picker}
                  >
                    {categories.map((cat) => (
                      <Picker.Item key={cat.key} label={cat.label} value={cat.key} />
                    ))}
                  </Picker>
                </View>
              ) : (
                <View style={styles.categoryTag}>
                  <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
                  <Text style={styles.categoryText}>
                    {categories.find(cat => cat.key === task.category)?.label || task.category}
                  </Text>
                </View>
              )}
            </View>

            {/* Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Time</Text>
              {isEditMode ? (
                <View style={styles.timeContainer}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.timeText}>{formatTime(editedTask.startTime)}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeSeparator}>-</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.timeText}>{formatTime(editedTask.endTime)}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.value}>
                  {formatTime(task.startTime)} - {formatTime(task.endTime)}
                </Text>
              )}
            </View>

            {/* Repeat Section - Only in Edit Mode */}
            {isEditMode && (
              <>
                <View style={styles.section}>
                  <View style={styles.repeatHeader}>
                    <Text style={styles.label}>Repeat</Text>
                    <Switch
                      value={editedTask.recurring || false}
                      onValueChange={(value) => {
                        setEditedTask({ 
                          ...editedTask, 
                          recurring: value,
                          recurrenceRule: value ? (editedTask.recurrenceRule || {
                            type: 'weekly',
                            interval: 1,
                            daysOfWeek: [1],
                          }) : undefined
                        });
                      }}
                      trackColor={{ false: '#E5E7EB', true: '#818CF8' }}
                      thumbColor={editedTask.recurring ? '#6366F1' : '#9CA3AF'}
                    />
                  </View>
                </View>

                {/* Frequency and Days - Only when Repeat is ON */}
                {editedTask.recurring && editedTask.recurrenceRule && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.label}>Frequency</Text>
                      <View style={styles.frequencyButtons}>
                        {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                          <TouchableOpacity
                            key={freq}
                            style={[
                              styles.frequencyButton,
                              editedTask.recurrenceRule?.type === freq && styles.selectedFrequency
                            ]}
                            onPress={() => {
                              setEditedTask({
                                ...editedTask,
                                recurrenceRule: {
                                  ...editedTask.recurrenceRule!,
                                  type: freq,
                                  daysOfWeek: freq === 'weekly' ? (editedTask.recurrenceRule?.daysOfWeek || [1]) : undefined
                                }
                              });
                            }}
                          >
                            <Text style={[
                              styles.frequencyText,
                              editedTask.recurrenceRule?.type === freq && styles.selectedFrequencyText
                            ]}>
                              {freq.charAt(0).toUpperCase() + freq.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Days of Week - Only for Weekly */}
                    {editedTask.recurrenceRule.type === 'weekly' && (
                      <View style={styles.section}>
                        <Text style={styles.label}>Days of Week</Text>
                        <View style={styles.daysContainer}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.dayButton,
                                editedTask.recurrenceRule?.daysOfWeek?.includes(index) && styles.selectedDay
                              ]}
                              onPress={() => {
                                const currentDays = editedTask.recurrenceRule?.daysOfWeek || [];
                                let newDays: number[];
                                
                                if (currentDays.includes(index)) {
                                  newDays = currentDays.filter(d => d !== index);
                                } else {
                                  newDays = [...currentDays, index].sort();
                                }
                                
                                // Ensure at least one day is selected
                                if (newDays.length === 0) {
                                  Alert.alert('Error', 'Please select at least one day');
                                  return;
                                }
                                
                                setEditedTask({
                                  ...editedTask,
                                  recurrenceRule: {
                                    ...editedTask.recurrenceRule!,
                                    daysOfWeek: newDays
                                  }
                                });
                              }}
                            >
                              <Text style={[
                                styles.dayText,
                                editedTask.recurrenceRule?.daysOfWeek?.includes(index) && styles.selectedDayText
                              ]}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* End Task Options */}
                    <View style={styles.section}>
                      <Text style={styles.label}>End Task</Text>
                      
                      {/* Option buttons */}
                      <View style={styles.endTypeButtons}>
                        <TouchableOpacity
                          style={[
                            styles.endTypeButton,
                            recurrenceEndType === 'date' && styles.selectedEndType,
                          ]}
                          onPress={() => setRecurrenceEndType('date')}
                        >
                          <Text style={[
                            styles.endTypeButtonText,
                            recurrenceEndType === 'date' && styles.selectedEndTypeText,
                          ]}>
                            On date
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.endTypeButton,
                            recurrenceEndType === 'occurrences' && styles.selectedEndType,
                          ]}
                          onPress={() => setRecurrenceEndType('occurrences')}
                        >
                          <Text style={[
                            styles.endTypeButtonText,
                            recurrenceEndType === 'occurrences' && styles.selectedEndTypeText,
                          ]}>
                            After occurrences
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.endTypeButton,
                            recurrenceEndType === 'duration' && styles.selectedEndType,
                          ]}
                          onPress={() => setRecurrenceEndType('duration')}
                        >
                          <Text style={[
                            styles.endTypeButtonText,
                            recurrenceEndType === 'duration' && styles.selectedEndTypeText,
                          ]}>
                            For duration
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* End date picker */}
                      {recurrenceEndType === 'date' && (
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowEndDatePicker(true)}
                        >
                          <Text style={styles.datePickerButtonText}>
                            {endDatePickerValue.toLocaleDateString()}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Occurrences input */}
                      {recurrenceEndType === 'occurrences' && (
                        <View style={styles.occurrencesInput}>
                          <TextInput
                            style={styles.occurrencesTextInput}
                            placeholder="30"
                            keyboardType="numeric"
                            value={editedTask.recurrenceRule?.endOccurrences?.toString() || ''}
                            onChangeText={(text) => {
                              const num = parseInt(text) || undefined;
                              setEditedTask({
                                ...editedTask,
                                recurrenceRule: {
                                  ...editedTask.recurrenceRule!,
                                  endOccurrences: num
                                }
                              });
                            }}
                          />
                          <Text style={styles.occurrencesLabel}>occurrences</Text>
                        </View>
                      )}
                      
                      {/* Duration dropdown */}
                      {recurrenceEndType === 'duration' && (
                        <View style={styles.durationButtons}>
                          {([1, 3, 6, 12] as const).map((months) => (
                            <TouchableOpacity
                              key={months}
                              style={[
                                styles.durationButton,
                                recurrenceDuration === months && styles.selectedDuration,
                              ]}
                              onPress={() => setRecurrenceDuration(months as 1 | 3 | 6 | 12)}
                            >
                              <Text style={[
                                styles.durationButtonText,
                                recurrenceDuration === months && styles.selectedDurationText,
                              ]}>
                                {months} {months === 1 ? 'month' : 'months'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, task.completed && styles.statusBadgeCompleted]}>
                  <Text style={[styles.statusText, task.completed && styles.statusTextCompleted]}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
                {!isEditMode && (
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={handleToggleComplete}
                  >
                    <Text style={styles.toggleButtonText}>
                      Mark as {task.completed ? 'Pending' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Recurring info if applicable */}
            {task.recurring && (
              <View style={styles.section}>
                <Text style={styles.label}>Recurring</Text>
                <View style={styles.recurringBadge}>
                  <Ionicons name="repeat" size={16} color="#666" />
                  <Text style={styles.recurringText}>This is a recurring task</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isEditMode ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditedTask({ ...task });
                    setIsEditMode(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: categoryColor }]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: categoryColor }]}
                  onPress={() => setIsEditMode(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Edit Task</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={(() => {
              const [hours, minutes] = editedTask.startTime.split(':');
              const date = new Date();
              date.setHours(parseInt(hours));
              date.setMinutes(parseInt(minutes));
              return date;
            })()}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              if (event.type === 'set') {
                updateTime(selectedDate, true);
              } else {
                setShowStartTimePicker(false);
              }
            }}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={(() => {
              const [hours, minutes] = editedTask.endTime.split(':');
              const date = new Date();
              date.setHours(parseInt(hours));
              date.setMinutes(parseInt(minutes));
              return date;
            })()}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              if (event.type === 'set') {
                updateTime(selectedDate, false);
              } else {
                setShowEndTimePicker(false);
              }
            }}
          />
        )}

        {/* Occurrence Choice Dialog */}
        {showOccurrenceDialog && (
          <Modal
            visible={showOccurrenceDialog}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowOccurrenceDialog(false)}
          >
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogContainer}>
                <Text style={styles.dialogTitle}>Edit Recurring Task</Text>
                <Text style={styles.dialogMessage}>
                  Do you want to edit only this occurrence or all future occurrences?
                </Text>
                
                <TouchableOpacity
                  style={styles.dialogOption}
                  onPress={() => {
                    setEditOccurrenceChoice('single');
                    setShowOccurrenceDialog(false);
                    handleSave();
                  }}
                >
                  <Ionicons name="calendar-outline" size={24} color="#6366F1" />
                  <View style={styles.dialogOptionText}>
                    <Text style={styles.dialogOptionTitle}>This occurrence only</Text>
                    <Text style={styles.dialogOptionSubtitle}>
                      Changes will apply only to this instance
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dialogOption}
                  onPress={() => {
                    setEditOccurrenceChoice('all');
                    setShowOccurrenceDialog(false);
                    handleSave();
                  }}
                >
                  <Ionicons name="repeat" size={24} color="#6366F1" />
                  <View style={styles.dialogOptionText}>
                    <Text style={styles.dialogOptionTitle}>All future occurrences</Text>
                    <Text style={styles.dialogOptionSubtitle}>
                      Changes will apply to all future instances
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dialogCancelButton}
                  onPress={() => setShowOccurrenceDialog(false)}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Delete Occurrence Choice Dialog */}
        {showDeleteOccurrenceDialog && (
          <Modal
            visible={showDeleteOccurrenceDialog}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              console.log('🗑️ DEBUG: Delete dialog onRequestClose');
              setShowDeleteOccurrenceDialog(false);
            }}
          >
            {console.log('🚨 DEBUG: DELETE DIALOG IS RENDERING!')}
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogContainer}>
                <Text style={styles.dialogTitle}>Delete Recurring Task</Text>
                <Text style={styles.dialogMessage}>
                  Do you want to delete only this occurrence or all future occurrences?
                </Text>
                
                <TouchableOpacity
                  style={styles.dialogOption}
                  onPress={() => handleDeleteWithChoice('single')}
                >
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  <View style={styles.dialogOptionText}>
                    <Text style={styles.dialogOptionTitle}>This occurrence only</Text>
                    <Text style={styles.dialogOptionSubtitle}>
                      Delete only this instance
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dialogOption}
                  onPress={() => handleDeleteWithChoice('all')}
                >
                  <Ionicons name="repeat" size={24} color="#EF4444" />
                  <View style={styles.dialogOptionText}>
                    <Text style={styles.dialogOptionTitle}>All future occurrences</Text>
                    <Text style={styles.dialogOptionSubtitle}>
                      Delete all future instances
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dialogCancelButton}
                  onPress={() => setShowDeleteOccurrenceDialog(false)}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        
        {/* End Date Picker for Recurring Tasks */}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDatePickerValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowEndDatePicker(Platform.OS === 'android');
              if (date) {
                setEndDatePickerValue(date);
                setEditedTask({
                  ...editedTask,
                  recurrenceRule: { 
                    ...editedTask.recurrenceRule!, 
                    endDate: date 
                  }
                });
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
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
    maxHeight: '80%',
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#1f2937',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#1f2937',
  },
  timeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D97706',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringText: {
    fontSize: 16,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  editButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedFrequency: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedFrequencyText: {
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDay: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedDayText: {
    color: '#fff',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Made darker to be more visible
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  dialogOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    gap: 16,
  },
  dialogOptionText: {
    flex: 1,
  },
  dialogOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dialogOptionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dialogCancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  dialogCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  endTaskContainer: {
    marginTop: 16,
  },
  endTypeButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  endTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedEndType: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  endTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
  },
  selectedEndTypeText: {
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  occurrencesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  occurrencesTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 4,
  },
  occurrencesLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDuration: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedDurationText: {
    color: '#fff',
  },
});