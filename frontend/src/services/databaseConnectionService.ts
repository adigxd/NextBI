import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl?: boolean;
  status: 'active' | 'inactive';
  lastTestedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConnectionDto {
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  options?: Record<string, any>;
}

const API_URL = '/api/connections';

// Use the getAuthHeaders function from authUtils

export const databaseConnectionService = {
  // Get all connections
  async getAllConnections(): Promise<DatabaseConnection[]> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.get(API_URL, authHeader);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  },

  // Get connection by ID
  async getConnectionById(id: string): Promise<DatabaseConnection> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching connection ${id}:`, error);
      throw error;
    }
  },

  // Create new connection
  async createConnection(connectionData: CreateConnectionDto): Promise<DatabaseConnection> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.post(API_URL, connectionData, authHeader);
      return response.data.data;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  },

  // Update connection
  async updateConnection(id: string, connectionData: Partial<CreateConnectionDto>): Promise<DatabaseConnection> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/${id}`, connectionData, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating connection ${id}:`, error);
      throw error;
    }
  },

  // Delete connection
  async deleteConnection(id: string): Promise<void> {
    try {
      const authHeader = await getAuthHeaders();
      await axios.delete(`${API_URL}/${id}`, authHeader);
    } catch (error) {
      console.error(`Error deleting connection ${id}:`, error);
      throw error;
    }
  },

  // Test connection
  async testConnection(id: string): Promise<{ status: 'active' | 'inactive', lastTestedAt: string }> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/${id}/test`, {}, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error testing connection ${id}:`, error);
      throw error;
    }
  }
};
