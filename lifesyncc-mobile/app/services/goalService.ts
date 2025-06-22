import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export interface Goal {
  _id?: string;
  id?: string;
  category: 'physical' | 'mental' | 'financial' | 'social';
  title: string;
  description: string;
  type: 'milestone' | 'numeric' | 'habit';
  priority?: 'high' | 'medium' | 'low';
  progress: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: Date;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class GoalService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getGoals(filters?: { category?: string; completed?: boolean }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    
    const url = `${API_URL}/goals${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await this.makeRequest(url);
    return data.goals;
  }

  async createGoal(goal: Omit<Goal, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const data = await this.makeRequest(`${API_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return data.goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const data = await this.makeRequest(`${API_URL}/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.goal;
  }

  async deleteGoal(id: string): Promise<void> {
    await this.makeRequest(`${API_URL}/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProgress(id: string, progressData: { currentValue?: number; progress?: number }): Promise<Goal> {
    const data = await this.makeRequest(`${API_URL}/goals/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
    return data.goal;
  }

  // Offline support methods
  async saveGoalsOffline(goals: Goal[]): Promise<void> {
    await AsyncStorage.setItem('offline_goals', JSON.stringify(goals));
  }

  async getOfflineGoals(): Promise<Goal[] | null> {
    const data = await AsyncStorage.getItem('offline_goals');
    return data ? JSON.parse(data) : null;
  }

  async clearOfflineGoals(): Promise<void> {
    await AsyncStorage.removeItem('offline_goals');
  }
}

export default new GoalService();