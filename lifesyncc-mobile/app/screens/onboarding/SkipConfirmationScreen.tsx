import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/types';

type SkipConfirmationScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'SkipConfirmation'>;

interface Props {
  navigation: SkipConfirmationScreenNavigationProp;
}

export default function SkipConfirmationScreen({ navigation }: Props) {
  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as any }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Skip Profile Setup?</Text>
        <Text style={styles.subtitle}>
          You can always complete your profile later from the settings menu.
        </Text>
        
        <Text style={styles.warningText}>
          Without this information, we won't be able to:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={styles.bulletPoint}>• Personalize your experience</Text>
          <Text style={styles.bulletPoint}>• Provide accurate fitness metrics</Text>
          <Text style={styles.bulletPoint}>• Give tailored recommendations</Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('NameInput')}
        >
          <Text style={styles.continueText}>Continue Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip Anyway</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  warningText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 15,
    fontWeight: '600',
  },
  bulletPoints: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#4c669f',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    color: '#999',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});