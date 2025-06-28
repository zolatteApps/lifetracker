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
  scheduleStartDate?: Date;
  scheduleEndDate?: Date;
}

class GoalService {
  API_URL = API_URL;

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  async getToken(): Promise<string | null> {
    return this.getAuthToken();
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
      let errorMessage = 'Request failed';
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch (parseError) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e);
      }
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    // If no content or content-length is 0, return early
    if (response.status === 204 || contentLength === '0') {
      return;
    }

    // For DELETE requests, try to parse JSON but don't fail if it's empty
    if (options.method === 'DELETE') {
      try {
        const text = await response.text();
        if (text) {
          return JSON.parse(text);
        }
        return;
      } catch (e) {
        // If parsing fails for DELETE, just return undefined
        return;
      }
    }

    // For other requests, parse JSON normally
    try {
      return await response.json();
    } catch (e) {
      console.warn('Failed to parse response as JSON:', e);
      return;
    }
  }

  async getGoals(filters?: { category?: string; completed?: boolean }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    
    const url = `${API_URL}/api/goals${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await this.makeRequest(url);
    return data.goals;
  }

  async createGoal(goal: Omit<Goal, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const data = await this.makeRequest(`${API_URL}/api/goals`, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return data.goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const data = await this.makeRequest(`${API_URL}/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.goal;
  }

  async deleteGoal(id: string): Promise<void> {
    await this.makeRequest(`${API_URL}/api/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProgress(id: string, progressData: { currentValue?: number; progress?: number }): Promise<Goal> {
    console.log('GoalService.updateProgress called with:', { id, progressData });
    // Use query parameter to avoid Vercel routing issues
    console.log('API URL:', `${API_URL}/api/goals-progress?goalId=${id}`);
    
    try {
      const data = await this.makeRequest(`${API_URL}/api/goals-progress?goalId=${id}`, {
        method: 'PUT',
        body: JSON.stringify(progressData),
      });
      console.log('Progress update response:', data);
      return data.goal;
    } catch (error) {
      console.error('GoalService.updateProgress error:', error);
      throw error;
    }
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