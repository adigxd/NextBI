import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class SurveyService {
  // Get all surveys (for admin)
  async getSurveys(page = 1, limit = 10, showPublishedOnly = false) {
    try {
      const response = await axios.get(`${API_URL}/surveys`, {
        params: { page, limit, showPublishedOnly },
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get active surveys (for users)
  async getActiveSurveys(page = 1, limit = 50) {
    try {
      const response = await axios.get(`${API_URL}/surveys/active`, {
        params: { page, limit },
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create a new survey
  async createSurvey(surveyData) {
    try {
      const response = await axios.post(`${API_URL}/surveys`, surveyData, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Toggle archive status of a survey (archive or unarchive)
  async toggleArchiveStatus(surveyId) {
    try {
      const response = await axios.post(`${API_URL}/surveys/${surveyId}/toggle-archive`, {}, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete a survey
  async deleteSurvey(surveyId) {
    try {
      const response = await axios.delete(`${API_URL}/surveys/${surveyId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update an existing survey
  async updateSurvey(surveyId, surveyData) {
    try {
      const response = await axios.put(`${API_URL}/surveys/${surveyId}`, surveyData, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get a specific survey by ID
  async getSurveyById(surveyId) {
    try {
      const response = await axios.get(`${API_URL}/surveys/${surveyId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Helper method to get authentication header
  getAuthHeader() {
    // Use the same key as AuthContext: 'token'
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Error handling
  handleError(error) {
    console.error('Survey Service Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server');
    } else {
      // Something happened in setting up the request
      throw new Error('Error setting up request');
    }
  }
}

export default new SurveyService();
