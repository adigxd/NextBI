/**
 * Auth utilities for working with tokens
 */
import { getToken } from '../services/authService';

/**
 * Get access token for API calls
 * This should be called from components that need to make API calls
 */
export const getAccessToken = async (): Promise<string> => {
  // Get the backend token from localStorage via authService
  const token = getToken();
  
  if (!token) {
    console.error('No backend token available');
    // Don't redirect automatically as it can cause infinite loops
    // Let the component handle the error
    throw new Error('No backend token available. Please login again.');
  }
  
  return token;
};

/**
 * Create auth headers for API requests
 */
export const getAuthHeaders = async () => {
  try {
    const token = await getAccessToken();
    console.log('Got access token for API request:', token ? 'Token available' : 'No token');
    // Return headers in the correct format for Axios
    return {
      Authorization: `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    // For debugging purposes, let's throw the error to see it in the network tab
    throw error;
  }
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
