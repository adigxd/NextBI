import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class DataRetentionService {
  // Archive a survey
  async archiveSurvey(surveyId) {
    try {
      const response = await axios.post(`${API_URL}/data-retention/surveys/${surveyId}/archive`, {}, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Restore an archived survey
  async restoreSurvey(surveyId) {
    try {
      const response = await axios.post(`${API_URL}/data-retention/surveys/${surveyId}/restore`, {}, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Permanently delete a survey and its data
  async purgeSurvey(surveyId) {
    try {
      const response = await axios.delete(`${API_URL}/data-retention/surveys/${surveyId}/purge`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Set retention period for a survey
  async setRetentionPeriod(surveyId, retentionEndDate) {
    try {
      const response = await axios.post(`${API_URL}/data-retention/surveys/${surveyId}/retention`, 
        { retentionEndDate }, 
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get archived surveys
  async getArchivedSurveys(page = 1, limit = 10) {
    try {
      const response = await axios.get(`${API_URL}/data-retention/surveys/archived`, {
        params: { page, limit },
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get audit logs for a survey
  async getSurveyAuditLogs(surveyId) {
    try {
      const response = await axios.get(`${API_URL}/data-retention/surveys/${surveyId}/logs`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get all audit logs
  async getAllAuditLogs(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_URL}/data-retention/logs`, {
        params: { page, limit },
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
    console.error('Data Retention Service Error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error('Error setting up request');
    }
  }
}

export default new DataRetentionService();
