import { apiClient } from './client';
import { InventoryItem, PaginatedResponse } from '../types';

export interface CreateInventoryData {
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
}

export interface UpdateInventoryData {
  name?: string;
  category?: string;
  quantity?: number;
  threshold?: number;
  unit?: string;
}

export const inventoryApi = {
  list: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<PaginatedResponse<InventoryItem>>('/inventory', { params });
    return res.data;
  },

  create: async (data: CreateInventoryData) => {
    const res = await apiClient.post<{ data: InventoryItem }>('/inventory', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateInventoryData) => {
    const res = await apiClient.patch<{ data: InventoryItem }>(`/inventory/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/inventory/${id}`);
  },

  adjust: async (id: string, delta: 1 | -1) => {
    const res = await apiClient.patch<{ data: InventoryItem }>(`/inventory/${id}/adjust`, { delta });
    return res.data.data;
  },
};
