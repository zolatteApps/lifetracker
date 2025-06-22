import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    proposedSchedule?: {
      summary: string;
      explanation: string;
      sessions: ScheduleSession[];
    };
  } | null;
  onAccept: () => void;
  onModify: () => void;
  onCancel: () => void;
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

export const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({
  visible,
  goalDetails,
  onAccept,
  onModify,
  onCancel,
  loading = false,
}) => {
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

  if (!goalDetails || !goalDetails.proposedSchedule) {
    return null;
  }

  const { proposedSchedule } = goalDetails;
  const categoryColor = categoryColors[goalDetails.category] || '#4F46E5';
  const categoryIcon = categoryIcons[goalDetails.category] || 'flag';

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
            <Text style={styles.title}>Goal & Schedule Preview</Text>
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
                  <Text style={styles.goalTitle}>{goalDetails.title}</Text>
                  <Text style={styles.goalCategory}>
                    {goalDetails.category.charAt(0).toUpperCase() + goalDetails.category.slice(1)} Goal
                  </Text>
                </View>
              </View>
              <Text style={styles.goalDescription}>{goalDetails.description}</Text>
            </View>

            {/* Proposed Schedule */}
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionTitle}>Proposed Schedule</Text>
              <Text style={styles.scheduleSummary}>{proposedSchedule.summary}</Text>

              {proposedSchedule.sessions.map((session, index) => (
                <View key={index} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Ionicons name="calendar-outline" size={20} color={categoryColor} />
                    <Text style={styles.sessionActivity}>{session.activity}</Text>
                  </View>
                  
                  <View style={styles.sessionDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {formatTime(session.time)} • {formatDuration(session.duration)}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="repeat-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{formatFrequency(session)}</Text>
                    </View>
                    
                    {session.days.length < 7 && (
                      <View style={styles.daysContainer}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <View
                            key={day}
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
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalText}>
                        Total: {session.totalOccurrences} sessions
                      </Text>
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
            <TouchableOpacity style={styles.modifyButton} onPress={onModify}>
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
          </View>
        </View>
      </View>
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
  goalCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
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
});