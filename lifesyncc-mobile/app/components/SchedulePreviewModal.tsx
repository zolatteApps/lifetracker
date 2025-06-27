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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduleSession {
  activity: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  daysPerWeek: number;
  time: string;
  duration: number;
  days: string[];
  totalOccurrences: number;
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
  onAccept: () => void;
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatFrequency = (session: ScheduleSession) => {
    if (session.frequency === 'daily') {
      return session.daysPerWeek === 7 ? 'Every day' : `${session.daysPerWeek}x per week`;
    }
    if (session.frequency === 'weekly') {
      return `Weekly on ${session.days.join(', ')}`;
    }
    return 'Monthly';
  };

  const handleSaveChanges = () => {
    if (onUpdate) {
      onUpdate(editedDetails);
    }
    setIsEditMode(false);
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
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
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
              <Text style={styles.sectionTitle}>Proposed Schedule</Text>
              <Text style={styles.scheduleSummary}>{proposedSchedule.summary}</Text>

              {proposedSchedule.sessions.map((session: ScheduleSession, index: number) => (
                <View key={index} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
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
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="repeat-outline" size={16} color="#666" />
                      {isEditMode ? (
                        <View style={styles.frequencyEditContainer}>
                          <Picker
                            selectedValue={session.frequency}
                            onValueChange={(value) => {
                              const newDetails = { ...editedDetails };
                              newDetails.proposedSchedule.sessions[index].frequency = value;
                              setEditedDetails(newDetails);
                            }}
                            style={styles.frequencyPicker}
                          >
                            <Picker.Item label="Daily" value="daily" />
                            <Picker.Item label="Weekly" value="weekly" />
                            <Picker.Item label="Monthly" value="monthly" />
                          </Picker>
                        </View>
                      ) : (
                        <Text style={styles.detailText}>{formatFrequency(session)}</Text>
                      )}
                    </View>
                    
                    {session.days.length < 7 && (
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
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

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
    marginBottom: 12,
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
});