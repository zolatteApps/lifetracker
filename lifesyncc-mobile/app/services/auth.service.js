import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

class AuthService {
  async login(email, password) {
    try {
      const response = await apiService.post(API_ENDPOINTS.auth.login, {
        email,
        password,
      });
      
      if (response.token) {
        await apiService.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(email, password) {
    try {
      const response = await apiService.post(API_ENDPOINTS.auth.register, {
        email,
        password,
      });
      
      if (response.token) {
        await apiService.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiService.get(API_ENDPOINTS.auth.user);
      return response.user;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      // Return null instead of throwing to prevent app from getting stuck
      return null;
    }
  }

  async logout() {
    await apiService.removeAuthToken();
  }

  async isAuthenticated() {
    const token = await apiService.getAuthToken();
    return !!token;
  }
}

export default new AuthService();