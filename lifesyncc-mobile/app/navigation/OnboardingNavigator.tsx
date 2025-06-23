import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';

// Import onboarding screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import NameInputScreen from '../screens/onboarding/NameInputScreen';
import AgeInputScreen from '../screens/onboarding/AgeInputScreen';
import GenderInputScreen from '../screens/onboarding/GenderInputScreen';
import HeightInputScreen from '../screens/onboarding/HeightInputScreen';
import SkipConfirmationScreen from '../screens/onboarding/SkipConfirmationScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="NameInput" component={NameInputScreen} />
      <Stack.Screen name="AgeInput" component={AgeInputScreen} />
      <Stack.Screen name="GenderInput" component={GenderInputScreen} />
      <Stack.Screen name="HeightInput" component={HeightInputScreen} />
      <Stack.Screen name="SkipConfirmation" component={SkipConfirmationScreen} />
    </Stack.Navigator>
  );
}