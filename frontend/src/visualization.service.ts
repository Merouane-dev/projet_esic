// frontend/src/services/visualization.service.ts
import { BASE_URL } from '../config';

export interface Visualization {
  id: number;
  name: string;
  description?: string;
  type: string;
  config: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator_id: number;
  dataset_id: number;
}

export interface VisualizationCreateRequest {
  name: string;
  description?: string;
  type: string;
  config: string;
  is_public: boolean;
  dataset_id: number;
}

class VisualizationService {
  private baseUrl = `${BASE_URL}/visualizations`;
  
  async getAllVisualizations(): Promise<Visualization[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(this.baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch visualizations');
    }
    return response.json();
  }
  
  async getVisualization(id: number): Promise<Visualization> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch visualization');
    }
    return response.json();
  }
  
  async createVisualization(data: VisualizationCreateRequest): Promise<Visualization> {
    const token = localStorage.getItem('token');
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create visualization');
    }
    
    return response.json();
  }
  
  async updateVisualization(id: number, data: Partial<Visualization>): Promise<Visualization> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update visualization');
    }
    
    return response.json();
  }
  
  async deleteVisualization(id: number): Promise<Visualization> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete visualization');
    }
    
    return response.json();
  }
  
  async getDatasetVisualizations(datasetId: number): Promise<Visualization[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/datasets/${datasetId}/visualizations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch visualizations for dataset');
    }
    
    return response.json();
  }
}

export const visualizationService = new VisualizationService();