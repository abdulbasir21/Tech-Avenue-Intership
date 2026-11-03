import { apiClient } from './client';
import { Asset, PaginatedResponse, AssetKind, AssetStatus } from '../types';

export interface CreateAssetData {
  name: string;
  kind: AssetKind;
  serialNumber?: string;
  status?: AssetStatus;
  assignedTo?: string | null;
  purchaseDate?: string | null;
}

export interface UpdateAssetData {
  name?: string;
  kind?: AssetKind;
  serialNumber?: string;
  status?: AssetStatus;
  purchaseDate?: string | null;
}

export const assetsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; q?: string }) => {
    const res = await apiClient.get<PaginatedResponse<Asset>>('/assets', { params });
    return res.data;
  },

  getMyAssets: async () => {
    const res = await apiClient.get<{ data: Asset[] }>('/assets/mine');
    return res.data.data;
  },

  create: async (data: CreateAssetData) => {
    const res = await apiClient.post<{ data: Asset }>('/assets', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateAssetData) => {
    const res = await apiClient.patch<{ data: Asset }>(`/assets/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/assets/${id}`);
  },

  assign: async (id: string, userId: string) => {
    const res = await apiClient.patch<{ data: Asset }>(`/assets/${id}/assign`, { userId });
    return res.data.data;
  },

  unassign: async (id: string) => {
    const res = await apiClient.patch<{ data: Asset }>(`/assets/${id}/unassign`);
    return res.data.data;
  },
};
