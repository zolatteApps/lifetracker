import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/types';

type AgeInputScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'AgeInput'>;
type AgeInputScreenRouteProp = RouteProp<OnboardingStackParamList, 'AgeInput'>;

interface Props {
  navigation: AgeInputScreenNavigationProp;
  route: AgeInputScreenRouteProp;
}

export default function AgeInputScreen({ navigation, route }: Props) {
  const [age, setAge] = useState('');

  const handleNext = () => {
    const ageNum = parseInt(age);
    if (ageNum >= 18 && ageNum <= 120) {
      navigation.navigate('GenderInput', { 
        onboardingData: { 
          ...route.params.onboardingData,
          age: ageNum 
        } 
      });
    }
  };

  const isValidAge = () => {
    const ageNum = parseInt(age);
    return ageNum >= 18 && ageNum <= 120;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '50%' }]} />
          </View>

          <Text style={styles.step}>Step 2 of 4</Text>
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>This helps us provide age-appropriate recommendations</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={handleNext}
            maxLength={3}
          />

          {age && !isValidAge() && (
            <Text style={styles.error}>Please enter a valid age between 18 and 120</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, !isValidAge() && styles.disabledButton]}
              onPress={handleNext}
              disabled={!isValidAge()}
            >
              <Text style={styles.nextText}>Next</Text>
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
    marginBottom: 40,
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