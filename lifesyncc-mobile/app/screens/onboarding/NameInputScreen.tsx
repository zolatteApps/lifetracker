import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/types';

type NameInputScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'NameInput'>;
type NameInputScreenRouteProp = RouteProp<OnboardingStackParamList, 'NameInput'>;

interface Props {
  navigation: NameInputScreenNavigationProp;
  route: NameInputScreenRouteProp;
}

export default function NameInputScreen({ navigation, route }: Props) {
  const [name, setName] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      navigation.navigate('AgeInput', { 
        onboardingData: { 
          ...route.params?.onboardingData,
          name: name.trim() 
        } 
      });
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
            <View style={[styles.progress, { width: '25%' }]} />
          </View>

          <Text style={styles.step}>Step 1 of 4</Text>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>This helps us personalize your experience</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={handleNext}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, !name.trim() && styles.disabledButton]}
              onPress={handleNext}
              disabled={!name.trim()}
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
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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