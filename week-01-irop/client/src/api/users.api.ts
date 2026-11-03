import { apiClient } from './client';
import { User, PaginatedResponse } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
  managerId?: string | null;
}

export interface UpdateUserData {
  name?: string;
  role?: 'employee' | 'manager' | 'admin';
  department?: string;
  managerId?: string | null;
  isActive?: boolean;
  quotas?: {
    casual?: { total?: number; used?: number };
    sick?: { total?: number; used?: number };
    annual?: { total?: number; used?: number };
    wfh?: { total?: number; used?: number };
  };
}

export const usersApi = {
  list: async (params?: { page?: number; limit?: number; role?: string; department?: string; search?: string }) => {
    const res = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return res.data;
  },

  create: async (data: CreateUserData) => {
    const res = await apiClient.post<{ data: User }>('/users', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateUserData) => {
    const res = await apiClient.patch<{ data: User }>(`/users/${id}`, data);
    return res.data.data;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const res = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },
};
