// frontend/src/services/user.service.ts
import { BASE_URL } from '../config';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface UserEditRequest {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

class UserService {
  private baseUrl = `${BASE_URL}/users`;
  
  async getAllUsers(): Promise<User[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(this.baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  }
  
  async getUser(id: number): Promise<User> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }
  
  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch current user');
    }
    return response.json();
  }
  
  async createUser(data: UserCreateRequest): Promise<User> {
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
      throw new Error(errorData.detail || 'Failed to create user');
    }
    
    return response.json();
  }
  
  async updateUser(id: number, data: UserEditRequest): Promise<User> {
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
      throw new Error('Failed to update user');
    }
    
    return response.json();
  }
  
  async deleteUser(id: number): Promise<User> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    return response.json();
  }
}

export const userService = new UserService();
