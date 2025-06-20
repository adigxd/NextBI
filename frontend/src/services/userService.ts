import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

const API_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
}

export interface ProjectUser extends User {
  role: 'admin' | 'editor' | 'viewer';
  isCreator?: boolean;
}

/**
 * Search for users by email or name
 * @param query Search query (minimum 3 characters)
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  if (query.length < 3) {
    throw new Error('Search query must be at least 3 characters');
  }

  const authHeaders = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/users/search`, {
    params: { query },
    ...authHeaders
  });
  
  return response.data.data;
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const authHeaders = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/auth/me`, authHeaders);
  
  return response.data.data;
};

/**
 * Get users in a project with their roles
 * @param projectId Project ID
 */
export const getProjectUsers = async (projectId: string): Promise<ProjectUser[]> => {
  const authHeaders = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/projects/${projectId}/users`, authHeaders);
  
  return response.data.data;
};

/**
 * Add a user to a project with a specific role
 * @param projectId Project ID
 * @param userId User ID
 * @param role User role in the project
 */
export const addUserToProject = async (
  projectId: string, 
  userId: string, 
  role: 'admin' | 'editor' | 'viewer'
): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  await axios.post(
    `${API_URL}/projects/${projectId}/users`, 
    { userId, role },
    authHeaders
  );
};

/**
 * Remove a user from a project
 * @param projectId Project ID
 * @param userId User ID
 */
export const removeUserFromProject = async (
  projectId: string, 
  userId: string
): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  await axios.delete(
    `${API_URL}/projects/${projectId}/users/${userId}`, 
    authHeaders
  );
};

/**
 * Check if the current user has a specific permission in a project
 * @param projectId Project ID
 * @param permission Permission to check
 */
export const hasProjectPermission = async (
  projectId: string,
  permission: 'view' | 'edit' | 'manage'
): Promise<boolean> => {
  try {
    const users = await getProjectUsers(projectId);
    const currentUser = await getCurrentUser();
    
    const userInProject = users.find(user => user.id === currentUser.id);
    
    if (!userInProject) {
      return false;
    }
    
    // Admin can do anything
    if (userInProject.role === 'admin' || userInProject.isCreator) {
      return true;
    }
    
    // Editor can view and edit but not manage
    if (userInProject.role === 'editor') {
      return permission === 'view' || permission === 'edit';
    }
    
    // Viewer can only view
    if (userInProject.role === 'viewer') {
      return permission === 'view';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking project permission:', error);
    return false;
  }
};
