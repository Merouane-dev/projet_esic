// frontend/src/services/dataset.service.ts
import { BASE_URL } from '../config';

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  row_count?: number;
  column_count?: number;
  is_public: boolean;
  owner_id: number;
}

export interface DatasetColumn {
  id: number;
  name: string;
  data_type: string;
  description?: string;
  is_nullable: boolean;
  dataset_id: number;
}

export interface DatasetCreateRequest {
  name: string;
  description?: string;
  is_public: boolean;
  file_type: string;
}

export interface DatasetResponse extends Dataset {
  columns: DatasetColumn[];
}

class DatasetService {
  private baseUrl = `${BASE_URL}/datasets`;
  
  async getAllDatasets(): Promise<Dataset[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(this.baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch datasets');
    }
    return response.json();
  }
  
  async getDataset(id: number): Promise<DatasetResponse> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dataset');
    }
    return response.json();
  }
  
  async uploadDataset(data: DatasetCreateRequest, file: File): Promise<Dataset> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('is_public', String(data.is_public));
    formData.append('file_type', data.file_type);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload dataset');
    }
    
    return response.json();
  }
  
  async previewDataset(id: number, rows: number = 10): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}/preview?n_rows=${rows}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to preview dataset');
    }
    
    return response.json();
  }
  
  async analyzeDataset(id: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}/analyze`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze dataset');
    }
    
    return response.json();
  }
  
  async updateDataset(id: number, data: Partial<Dataset>): Promise<Dataset> {
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
      throw new Error('Failed to update dataset');
    }
    
    return response.json();
  }
  
  async deleteDataset(id: number): Promise<Dataset> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete dataset');
    }
    
    return response.json();
  }
}

export const datasetService = new DatasetService();