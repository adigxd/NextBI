import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class SurveyAssignmentService {
  // Get all users assigned to a survey
  async getUsersBySurveyId(surveyId) {
    try {
      const response = await axios.get(
        `${API_URL}/survey-assignments/survey/${surveyId}/users`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Assign a user to a survey (by userId or email)
  async assignUserToSurvey(surveyId, userIdOrEmail) {
    try {
      // Check if the parameter is an email address or a user ID
      const isEmail = typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@');
      
      const payload = {
        surveyId,
        // If it's an email, send it as email, otherwise as userId
        ...(isEmail ? { email: userIdOrEmail } : { userId: userIdOrEmail })
      };
      
      const response = await axios.post(
        `${API_URL}/survey-assignments/assign`,
        payload,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Remove a user from a survey
  async removeUserFromSurvey(surveyId, userId) {
    try {
      const response = await axios.delete(
        `${API_URL}/survey-assignments/${surveyId}/user/${userId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Search for users to assign
  async searchUsers(query) {
    try {
      const response = await axios.get(
        `${API_URL}/survey-assignments/search-users?query=${encodeURIComponent(query)}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Auto-assign all users with 'user' role to a survey
  async autoAssignUsers(surveyId) {
    try {
      const response = await axios.post(
        `${API_URL}/survey-assignments/survey/${surveyId}/auto-assign`,
        {},
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get all surveys assigned to the current user
  async getAssignedSurveys() {
    try {
      const response = await axios.get(
        `${API_URL}/survey-assignments/user/surveys`,
        { headers: this.getAuthHeader() }
      );
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
    console.error('Survey Assignment Service Error:', error);
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

export default new SurveyAssignmentService();
