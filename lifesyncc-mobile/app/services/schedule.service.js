import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

class ScheduleService {
  async getSchedule(date) {
    try {
      const response = await apiService.request(`/api/schedule/${date}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching schedule:', error);
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