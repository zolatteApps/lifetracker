import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import apiService from '../../services/api.service';

type HeightInputScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'HeightInput'>;
type HeightInputScreenRouteProp = RouteProp<OnboardingStackParamList, 'HeightInput'>;

interface Props {
  navigation: HeightInputScreenNavigationProp;
  route: HeightInputScreenRouteProp;
}

export default function HeightInputScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidHeight = () => {
    if (unit === 'cm') {
      const heightNum = parseFloat(height);
      return heightNum >= 50 && heightNum <= 300;
    } else {
      const feetNum = parseInt(feet);
      const inchesNum = parseInt(inches) || 0;
      return feetNum >= 2 && feetNum <= 9 && inchesNum >= 0 && inchesNum < 12;
    }
  };

  const getHeightValue = () => {
    if (unit === 'cm') {
      return parseFloat(height);
    } else {
      // Convert feet and inches to cm
      const feetNum = parseInt(feet);
      const inchesNum = parseInt(inches) || 0;
      const totalInches = (feetNum * 12) + inchesNum;
      return Math.round(totalInches * 2.54);
    }
  };

  const handleComplete = async () => {
    if (!isValidHeight() || !user) return;

    setLoading(true);
    try {
      const onboardingData = {
        ...route.params.onboardingData,
        height: {
          value: getHeightValue(),
          unit: 'cm', // Always store in cm
        },
        isOnboardingCompleted: true,
        profileCompletedAt: new Date().toISOString(),
      };

      // Update user profile via API
      await apiService.post('/auth/update-profile', onboardingData);

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as any }],
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'Failed to save your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '100%' }]} />
          </View>

          <Text style={styles.step}>Step 4 of 4</Text>
          <Text style={styles.title}>What's your height?</Text>
          <Text style={styles.subtitle}>This helps us calculate accurate fitness metrics</Text>

          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'cm' && styles.selectedUnit]}
              onPress={() => setUnit('cm')}
            >
              <Text style={[styles.unitText, unit === 'cm' && styles.selectedUnitText]}>CM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'ft' && styles.selectedUnit]}
              onPress={() => setUnit('ft')}
            >
              <Text style={[styles.unitText, unit === 'ft' && styles.selectedUnitText]}>FT/IN</Text>
            </TouchableOpacity>
          </View>

          {unit === 'cm' ? (
            <TextInput
              style={styles.input}
              placeholder="Enter height in cm"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleComplete}
              maxLength={3}
            />
          ) : (
            <View style={styles.feetInchesContainer}>
              <TextInput
                style={[styles.input, styles.feetInput]}
                placeholder="Feet"
                value={feet}
                onChangeText={setFeet}
                keyboardType="numeric"
                maxLength={1}
              />
              <Text style={styles.separator}>ft</Text>
              <TextInput
                style={[styles.input, styles.inchesInput]}
                placeholder="Inches"
                value={inches}
                onChangeText={setInches}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.separator}>in</Text>
            </View>
          )}

          {((unit === 'cm' && height) || (unit === 'ft' && feet)) && !isValidHeight() && (
            <Text style={styles.error}>
              {unit === 'cm' 
                ? 'Please enter a valid height between 50 and 300 cm'
                : 'Please enter a valid height'}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, (!isValidHeight() || loading) && styles.disabledButton]}
              onPress={handleComplete}
              disabled={!isValidHeight() || loading}
            >
              <Text style={styles.nextText}>{loading ? 'Saving...' : 'Complete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 30,
  },
  progress: {
    height: '100%',
    backgroundColor: '#4c669f',
    borderRadius: 2,
  },
  step: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  unitSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedUnit: {
    backgroundColor: '#4c669f',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedUnitText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  feetInchesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  feetInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  inchesInput: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 0,
  },
  separator: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 30,
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  backText: {
    color: '#666',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#4c669f',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});