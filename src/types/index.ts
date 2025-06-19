export interface Goal {
  id: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  title: string;
  description: string;
  actionItems: ActionItem[];
  progress: number;
}

export interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface ScheduleBlock {
  id: string;
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  startTime: string;
  endTime: string;
  completed: boolean;
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