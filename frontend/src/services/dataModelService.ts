import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

export interface DataModel {
  id: string;
  name: string;
  description: string;
  connectionId: string;
  schema: string;
  tables: string[];
  query: string;
  status: 'active' | 'draft' | 'error';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDataModelDto {
  name: string;
  description: string;
  connectionId: string;
  schema?: string;
  tables?: string[];
  query?: string;
}

const API_URL = '/api/data-models';

export const dataModelService = {
  // Get all data models
  async getAllDataModels(): Promise<DataModel[]> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.get(API_URL, authHeader);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching data models:', error);
      throw error;
    }
  },

  // Get data model by ID
  async getDataModelById(id: string): Promise<DataModel> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data model ${id}:`, error);
      throw error;
    }
  },

  // Create new data model
  async createDataModel(dataModelData: CreateDataModelDto): Promise<DataModel> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.post(API_URL, dataModelData, authHeader);
      return response.data.data;
    } catch (error) {
      console.error('Error creating data model:', error);
      throw error;
    }
  },

  // Update data model
  async updateDataModel(id: string, dataModelData: Partial<CreateDataModelDto>): Promise<DataModel> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/${id}`, dataModelData, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating data model ${id}:`, error);
      throw error;
    }
  },

  // Delete data model
  async deleteDataModel(id: string): Promise<void> {
    try {
      const authHeader = await getAuthHeaders();
      await axios.delete(`${API_URL}/${id}`, authHeader);
    } catch (error) {
      console.error(`Error deleting data model ${id}:`, error);
      throw error;
    }
  },

  // Get database schema for a connection
  async getDatabaseSchema(connectionId: string): Promise<{schemas: string[], tables: Record<string, string[]>}> {
    try {
      const authHeader = await getAuthHeaders();
      const response = await axios.get(`/api/connections/${connectionId}/schema`, authHeader);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching schema for connection ${connectionId}:`, error);
      throw error;
    }
  }
};
