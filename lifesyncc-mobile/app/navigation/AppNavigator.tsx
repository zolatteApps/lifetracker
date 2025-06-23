import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext-mongodb';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PhoneLoginScreen } from '../screens/auth/PhoneLoginScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { GoalsScreen } from '../screens/main/GoalsScreen';
import { ScheduleScreen } from '../screens/main/ScheduleScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { FeedbackListScreen } from '../screens/main/FeedbackListScreen';
import { Ionicons } from '@expo/vector-icons';
import OnboardingNavigator from './OnboardingNavigator';
import { RootStackParamList } from './types';

const RootStack = createStackNavigator<RootStackParamList>();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Goals') {
          iconName = focused ? 'flag' : 'flag-outline';
        } else if (route.name === 'Schedule') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Feedback') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'alert-circle';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#7C3AED',
      tabBarInactiveTintColor: '#9CA3AF',
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Goals" component={GoalsScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="Feedback" component={FeedbackListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ fontSize: 18, color: '#4F46E5', marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  const shouldShowOnboarding = user && !user.isOnboardingCompleted;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : shouldShowOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};