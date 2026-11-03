import { apiClient } from './client';
import { LeaveRequest, LeaveBalance, LeaveType, PaginatedResponse } from '../types';

export interface CreateLeaveData {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export const leavesApi = {
  create: async (data: CreateLeaveData) => {
    const res = await apiClient.post<{ data: LeaveRequest }>('/leaves', data);
    return res.data.data;
  },

  getMyLeaves: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get<PaginatedResponse<LeaveRequest>>('/leaves/mine', { params });
    return res.data;
  },

  getBalance: async () => {
    const res = await apiClient.get<{ data: LeaveBalance[] }>('/leaves/balance');
    return res.data.data;
  },

  cancel: async (id: string) => {
    const res = await apiClient.patch<{ data: LeaveRequest }>(`/leaves/${id}/cancel`);
    return res.data.data;
  },

  getTeamLeaves: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get<PaginatedResponse<LeaveRequest>>('/leaves/team', { params });
    return res.data;
  },

  approve: async (id: string, reviewNote?: string) => {
    const res = await apiClient.patch<{ data: LeaveRequest }>(`/leaves/${id}/approve`, { reviewNote });
    return res.data.data;
  },

  reject: async (id: string, reviewNote?: string) => {
    const res = await apiClient.patch<{ data: LeaveRequest }>(`/leaves/${id}/reject`, { reviewNote });
    return res.data.data;
  },
};
