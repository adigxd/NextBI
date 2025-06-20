import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Set token in local storage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Set user in local storage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get current user from local storage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to home page
    window.location.href = '/';
  }

  // Get authentication header
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export default new AuthService();
