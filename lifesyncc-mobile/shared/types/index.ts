// Shared types for both web and mobile apps

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastActive: Date;
  role: 'user' | 'admin';
}

export interface Goal {
  id: string;
  userId: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  title: string;
  description: string;
  type: 'milestone' | 'numeric' | 'habit';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryGoals {
  category: 'physical' | 'mental' | 'financial' | 'social';
  goals: Goal[];
}

export interface ActionItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleBlock {
  id: string;
  userId: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  startTime: string;
  endTime: string;
  completed: boolean;
  date: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  goals: string;
  achievements: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  wakeUpTime: string;
  sleepTime: string;
  checkInFrequency: number; // in minutes
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  enabled: boolean;
  checkInReminders: boolean;
  goalDeadlines: boolean;
  dailyProgress: boolean;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  notes: string;
  completedTasks: string[];
  goalProgress: { goalId: string; progress: number }[];
}

export interface Analytics {
  userId: string;
  date: Date;
  categoryProgress: {
    physical: number;
    mental: number;
    financial: number;
    social: number;
  };
  completedGoals: number;
  totalGoals: number;
  moodScore: number;
}

// MongoDB collection names
export const COLLECTIONS = {
  USERS: 'users',
  GOALS: 'goals',
  SCHEDULE: 'schedule',
  CHECKINS: 'checkins',
  ANALYTICS: 'analytics',
  USER_PROFILES: 'userProfiles'
} as const;