import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Goal } from '../services/goalService';

interface GoalProgressModalProps {
  visible: boolean;
  goal: Goal | null;
  categoryColor: string;
  onClose: () => void;
  onUpdate: (goalId: string, newValue: number) => Promise<void>;
}

export const GoalProgressModal: React.FC<GoalProgressModalProps> = ({
  visible,
  goal,
  categoryColor,
  onClose,
  onUpdate,
}) => {
  const [value, setValue] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (goal) {
      if (goal.type === 'milestone') {
        setSliderValue(goal.progress || 0);
      } else {
        setValue((goal.currentValue || 0).toString());
      }
    }
  }, [goal]);

  const handleUpdate = async () => {
    if (!goal) return;

    let updateValue: number;
    if (goal.type === 'milestone') {
      updateValue = sliderValue;
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        Alert.alert('Error', 'Please enter a valid number');
        return;
      }
      updateValue = numValue;
    }

    setUpdating(true);
    try {
      await onUpdate(goal._id || goal.id || '', updateValue);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  if (!goal) return null;

  const getProgressPercentage = () => {
    if (goal.type === 'milestone') {
      return sliderValue;
    } else if (goal.targetValue && goal.targetValue > 0) {
      const numValue = parseFloat(value) || 0;
      return Math.min(Math.round((numValue / goal.targetValue) * 100), 100);
    }
    return 0;
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
            <Text style={styles.modalTitle}>Update Progress</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </View>

          <View style={styles.progressSection}>
            {goal.type === 'milestone' ? (
              <>
                <Text style={styles.label}>Progress: {Math.round(sliderValue)}%</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  step={5}
                  minimumTrackTintColor={categoryColor}
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor={categoryColor}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0%</Text>
                  <Text style={styles.sliderLabel}>50%</Text>
                  <Text style={styles.sliderLabel}>100%</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  {goal.type === 'habit' ? 'Days Completed' : 'Current Value'}
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  {goal.unit && <Text style={styles.unit}>{goal.unit}</Text>}
                </View>
                {goal.targetValue && (
                  <Text style={styles.targetText}>
                    Target: {goal.targetValue} {goal.unit || ''}
                  </Text>
                )}
              </>
            )}

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: categoryColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {getProgressPercentage()}% Complete
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: categoryColor }]}
              onPress={handleUpdate}
              disabled={updating}
            >
              <Text style={styles.updateButtonText}>
                {updating ? 'Updating...' : 'Update Progress'}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
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
  goalInfo: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressSection: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#1f2937',
  },
  unit: {
    fontSize: 16,
    color: '#6b7280',
  },
  targetText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
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
  updateButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});