import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/types';

type GenderInputScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'GenderInput'>;
type GenderInputScreenRouteProp = RouteProp<OnboardingStackParamList, 'GenderInput'>;

interface Props {
  navigation: GenderInputScreenNavigationProp;
  route: GenderInputScreenRouteProp;
}

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export default function GenderInputScreen({ navigation, route }: Props) {
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  const handleNext = () => {
    if (selectedGender) {
      navigation.navigate('HeightInput', { 
        onboardingData: { 
          ...route.params.onboardingData,
          gender: selectedGender 
        } 
      });
    }
  };

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '75%' }]} />
        </View>

        <Text style={styles.step}>Step 3 of 4</Text>
        <Text style={styles.title}>Select your gender</Text>
        <Text style={styles.subtitle}>This helps us provide personalized health insights</Text>

        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedGender === option.value && styles.selectedOption,
              ]}
              onPress={() => setSelectedGender(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedGender === option.value && styles.selectedText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !selectedGender && styles.disabledButton]}
            onPress={handleNext}
            disabled={!selectedGender}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 40,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  selectedOption: {
    borderColor: '#4c669f',
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#4c669f',
    fontWeight: '600',
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