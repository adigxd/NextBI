import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ResponseService {
  // Submit a response to a survey
  async submitResponse(data) {
    try {
      // Get auth header if available, but don't require it for anonymous surveys
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['Content-Type'] = 'application/json';
      
      const response = await axios.post(`${API_URL}/responses`, data, { headers });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get responses for a survey (admin only)
  async getResponsesBySurveyId(surveyId) {
    try {
      const response = await axios.get(`${API_URL}/responses/survey/${surveyId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get user's own responses
  async getUserResponses() {
    try {
      const response = await axios.get(`${API_URL}/responses/user/me`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get auth header
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Error handling
  handleError(error) {
    console.error('Response Service Error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error('Error setting up request');
    }
  }
}

export default new ResponseService();
