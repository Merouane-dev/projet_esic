// frontend/src/services/report.service.ts
import { BASE_URL } from '../config';

export interface Report {
  id: number;
  name: string;
  description?: string;
  content?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator_id: number;
  dataset_id: number;
}

export interface ReportCreateRequest {
  name: string;
  description?: string;
  content?: string;
  is_public: boolean;
  dataset_id: number;
  visualization_ids: number[];
}

export interface ReportEditRequest {
  name?: string;
  description?: string;
  content?: string;
  is_public?: boolean;
  visualization_ids?: number[];
}

class ReportService {
  private baseUrl = `${BASE_URL}/reports`;
  
  async getAllReports(): Promise<Report[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(this.baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return response.json();
  }
  
  async getReport(id: number): Promise<Report> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    return response.json();
  }
  
  async createReport(data: ReportCreateRequest): Promise<Report> {
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
      throw new Error(errorData.detail || 'Failed to create report');
    }
    
    return response.json();
  }
  
  async updateReport(id: number, data: ReportEditRequest): Promise<Report> {
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
      throw new Error('Failed to update report');
    }
    
    return response.json();
  }
  
  async deleteReport(id: number): Promise<Report> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
    
    return response.json();
  }
  
  async getDatasetReports(datasetId: number): Promise<Report[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/datasets/${datasetId}/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports for dataset');
    }
    
    return response.json();
  }
  
  async exportReportPdf(id: number): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}/export-pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export report as PDF');
    }
    
    return response.blob();
  }
}

export const reportService = new ReportService();
