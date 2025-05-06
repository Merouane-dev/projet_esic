// frontend/src/services/audit.service.ts
import { BASE_URL } from '../config';

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details?: string;
  ip_address?: string;
  timestamp: string;
  user_id: number;
}

class AuditService {
  private baseUrl = `${BASE_URL}/audit-logs`;
  
  async getAuditLogs(
    skip: number = 0,
    limit: number = 100,
    user_id?: number,
    entity_type?: string,
    entity_id?: number,
    action?: string
  ): Promise<AuditLog[]> {
    const token = localStorage.getItem('token');
    
    let url = `${this.baseUrl}?skip=${skip}&limit=${limit}`;
    
    if (user_id) {
      url += `&user_id=${user_id}`;
    }
    
    if (entity_type) {
      url += `&entity_type=${encodeURIComponent(entity_type)}`;
    }
    
    if (entity_id) {
      url += `&entity_id=${entity_id}`;
    }
    
    if (action) {
      url += `&action=${encodeURIComponent(action)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    
    return response.json();
  }
  
  async getMyActivity(
    skip: number = 0,
    limit: number = 100,
    entity_type?: string,
    entity_id?: number,
    action?: string
  ): Promise<AuditLog[]> {
    const token = localStorage.getItem('token');
    
    let url = `${this.baseUrl}/my-activity?skip=${skip}&limit=${limit}`;
    
    if (entity_type) {
      url += `&entity_type=${encodeURIComponent(entity_type)}`;
    }
    
    if (entity_id) {
      url += `&entity_id=${entity_id}`;
    }
    
    if (action) {
      url += `&action=${encodeURIComponent(action)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }
    
    return response.json();
  }
}

export const auditService = new AuditService();
