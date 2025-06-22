import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

interface FeedbackData {
  category: string;
  message: string;
}

class FeedbackService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  async submitFeedback(data: FeedbackData): Promise<any> {
    const token = await this.getAuthToken();
    console.log('Submitting feedback:', data);
    console.log('API URL:', `${API_URL}/api/feedback`);
    console.log('Has token:', !!token);
    
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      
      if (!response.ok) {
        let errorMessage = 'Failed to submit feedback';
        try {
          const error = await response.json();
          console.error('API Error:', error);
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response');
          if (response.status === 404) {
            errorMessage = 'Feedback endpoint not found. Please check deployment.';
          }
        }
        throw new Error(errorMessage);
      }

      try {
        return await response.json();
      } catch (e) {
        console.error('Failed to parse success response as JSON');
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async getUserFeedback(): Promise<any> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feedback');
    }

    return response.json();
  }
}

export default new FeedbackService();