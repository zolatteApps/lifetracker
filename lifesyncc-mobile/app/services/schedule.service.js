import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ScheduleService {
  // Cache key prefix for schedule data
  CACHE_KEY_PREFIX = '@schedule_cache_';

  // Get cache key for a specific date
  getCacheKey(date) {
    return `${this.CACHE_KEY_PREFIX}${date}`;
  }

  // Get cached schedule for a date
  async getCachedSchedule(date) {
    try {
      const cached = await AsyncStorage.getItem(this.getCacheKey(date));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  // Save schedule to cache
  async cacheSchedule(date, data) {
    try {
      await AsyncStorage.setItem(this.getCacheKey(date), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  async getSchedule(date) {
    try {
      const response = await apiService.request(`/api/schedule/date?date=${date}`, {
        method: 'GET',
      });
      // Cache the successful response
      await this.cacheSchedule(date, response);
      return response;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Try to return cached data on error
      const cached = await this.getCachedSchedule(date);
      if (cached) {
        console.log('Returning cached schedule due to error');
        return cached.data;
      }
      throw error;
    }
  }

  async updateSchedule(date, blocks) {
    try {
      const response = await apiService.request('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ date, blocks }),
      });
      return response;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  async updateScheduleBlock(scheduleId, blockId, updates) {
    try {
      const response = await apiService.request('/api/schedule', {
        method: 'PUT',
        body: JSON.stringify({ scheduleId, blockId, updates }),
      });
      return response;
    } catch (error) {
      console.error('Error updating schedule block:', error);
      throw error;
    }
  }

  async deleteScheduleBlock(scheduleId, blockId) {
    try {
      const response = await apiService.request('/api/schedule', {
        method: 'DELETE',
        body: JSON.stringify({ scheduleId, blockId }),
      });
      return response;
    } catch (error) {
      console.error('Error deleting schedule block:', error);
      throw error;
    }
  }

  async generateSchedule(date, goals) {
    try {
      const response = await apiService.request('/api/schedule/generate', {
        method: 'POST',
        body: JSON.stringify({ date, goals }),
      });
      return response;
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  async createRecurringTask(task) {
    try {
      console.log('Original task data:', JSON.stringify(task, null, 2));
      
      // Extract the block data from the task
      // The task structure might have the block nested or at root level
      const blockData = task.block || task;
      
      // Transform the data to match what the API expects
      const requestData = {
        block: {
          id: blockData.id,
          title: blockData.title,
          category: blockData.category,
          startTime: blockData.startTime,
          endTime: blockData.endTime,
          completed: blockData.completed || false,
          recurring: true,
          recurrenceRule: blockData.recurrenceRule || task.recurrenceRule,
          recurrenceId: blockData.recurrenceId
        },
        startDate: task.startDate || blockData.startDate,
        daysAhead: 90 // Optional, defaults to 90 in API
      };
      
      console.log('Creating recurring task with data:', JSON.stringify(requestData, null, 2));
      const response = await apiService.post('/api/schedule/recurring', requestData);
      console.log('Recurring task created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating recurring task:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateBlockId() {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new ScheduleService();