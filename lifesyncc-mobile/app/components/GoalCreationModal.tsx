import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Goal } from '../services/goalService';

interface GoalCreationModalProps {
  visible: boolean;
  category: 'physical' | 'mental' | 'financial' | 'social';
  categoryColor: string;
  onClose: () => void;
  onSave: (goal: Omit<Goal, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'completed'>) => Promise<void>;
  prefillData?: {
    title: string;
    description: string;
    type?: 'milestone' | 'numeric' | 'habit';
    priority?: 'high' | 'medium' | 'low';
    targetValue?: number;
    unit?: string;
    dueDate?: Date;
    currentValue?: number;
  };
}

export const GoalCreationModal: React.FC<GoalCreationModalProps> = ({
  visible,
  category,
  categoryColor,
  onClose,
  onSave,
  prefillData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'milestone' | 'numeric' | 'habit'>('numeric');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Handle prefill data when modal opens
  useEffect(() => {
    if (visible && prefillData) {
      setTitle(prefillData.title);
      setDescription(prefillData.description);
      
      if (prefillData.type) {
        setType(prefillData.type);
      }
      if (prefillData.priority) {
        setPriority(prefillData.priority);
      }
      if (prefillData.targetValue !== undefined) {
        setTargetValue(prefillData.targetValue.toString());
      }
      if (prefillData.unit) {
        setUnit(prefillData.unit);
      }
      if (prefillData.dueDate) {
        setDueDate(prefillData.dueDate);
      }
      if (prefillData.currentValue !== undefined) {
        setCurrentValue(prefillData.currentValue.toString());
      }
    }
  }, [visible, prefillData]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('numeric');
    setPriority('medium');
    setTargetValue('');
    setCurrentValue('0');
    setUnit('');
    setDueDate(undefined);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a goal description');
      return;
    }

    if ((type === 'numeric' || type === 'habit') && !targetValue) {
      Alert.alert('Error', 'Please enter a target value');
      return;
    }

    setSaving(true);
    try {
      const goal: Omit<Goal, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'completed'> = {
        category,
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        unit: unit.trim(),
        dueDate,
      };

      await onSave(goal);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getUnitSuggestions = () => {
    switch (category) {
      case 'physical':
        return ['km', 'miles', 'minutes', 'hours', 'reps', 'sets', 'lbs', 'kg'];
      case 'mental':
        return ['books', 'pages', 'minutes', 'hours', 'sessions', 'courses'];
      case 'financial':
        return ['$', '€', '£', '%', 'months'];
      case 'social':
        return ['times', 'people', 'events', 'calls', 'messages'];
      default:
        return [];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter goal title"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your goal"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Goal Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={type}
                  onValueChange={(value) => setType(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Numeric (track progress with numbers)" value="numeric" />
                  <Picker.Item label="Habit (daily/weekly tracking)" value="habit" />
                  <Picker.Item label="Milestone (yes/no achievement)" value="milestone" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && styles.priorityButtonActive,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p && styles.priorityTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(type === 'numeric' || type === 'habit') && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Target Value *</Text>
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[styles.input, styles.valueInput]}
                      placeholder="0"
                      value={targetValue}
                      onChangeText={setTargetValue}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.unitInput]}
                      placeholder="Unit"
                      value={unit}
                      onChangeText={setUnit}
                    />
                  </View>
                  <View style={styles.unitSuggestions}>
                    {getUnitSuggestions().slice(0, 4).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={styles.unitChip}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={styles.unitChipText}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Value</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={currentValue}
                    onChangeText={setCurrentValue}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
              {dueDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setDueDate(undefined)}
                >
                  <Text style={styles.clearDateText}>Clear date</Text>
                </TouchableOpacity>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: categoryColor }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Creating...' : 'Create Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  priorityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  valueInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  unitSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  unitChipText: {
    fontSize: 12,
    color: '#4b5563',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});