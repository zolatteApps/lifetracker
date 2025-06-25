export interface Goal {
  id: string;
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
}

export interface CategoryGoals {
  category: 'physical' | 'mental' | 'financial' | 'social';
  goals: Goal[];
}

export interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: Date;
  endOccurrences?: number;
  exceptions?: Date[];
}

export interface ScheduleBlock {
  id: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'personal';
  startTime: string;
  endTime: string;
  completed: boolean;
  goalId?: string;
  recurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  recurrenceId?: string;
  originalDate?: Date;
}

export interface UserProfile {
  goals: string;
  achievements: string;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  timestamp: Date;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  notes: string;
  completedTasks: string[];
}

export interface User {
  id?: string;
  _id: string;
  email: string;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: {
    value: number;
    unit: 'cm' | 'ft';
  };
  isOnboardingCompleted: boolean;
  profileCompletedAt?: Date;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface Feedback {
  _id: string;
  userId: User | string;
  category: 'bug' | 'feature' | 'general';
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminNotes?: string;
  createdAt: Date;
}

export interface AdminStats {
  users: {
    totalUsers: number;
    verifiedUsers: number;
    completedOnboarding: number;
    adminUsers: number;
  };
  goals: {
    totalGoals: number;
    completedGoals: number;
    physicalGoals: number;
    mentalGoals: number;
    financialGoals: number;
    socialGoals: number;
  };
  feedback: {
    totalFeedback: number;
    pendingFeedback: number;
    reviewedFeedback: number;
    resolvedFeedback: number;
  };
}