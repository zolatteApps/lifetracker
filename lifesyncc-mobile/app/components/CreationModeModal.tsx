import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreationModeModalProps {
  visible: boolean;
  onAutoCreate: () => void;
  onManualCreate: () => void;
  onCancel: () => void;
}

export const CreationModeModal: React.FC<CreationModeModalProps> = ({
  visible,
  onAutoCreate,
  onManualCreate,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>How would you like to create your goal?</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Auto Create Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onAutoCreate}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Auto Create with AI</Text>
              </View>
              <Text style={styles.helperText}>AI will suggest a schedule for you</Text>
            </TouchableOpacity>

            {/* Manual Create Button */}
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onManualCreate}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="create-outline" size={24} color="#7C3AED" />
                <Text style={styles.secondaryButtonText}>Create Manually</Text>
              </View>
              <Text style={[styles.helperText, styles.secondaryHelperText]}>
                Create your own custom schedule
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  button: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
  },
  helperText: {
    fontSize: 14,
    color: '#E9D5FF',
    textAlign: 'center',
  },
  secondaryHelperText: {
    color: '#9CA3AF',
  },
});