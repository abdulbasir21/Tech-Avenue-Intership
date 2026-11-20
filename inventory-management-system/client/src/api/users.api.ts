import {
  DepartmentOption,
  ManagedUser,
  PaginationMeta,
  RoleOption,
} from '../types/auth';
import { api } from './axios';

export interface GetUsersParams {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  username: string;
  password: string;
  roleId: number;
  departmentId: number;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
  roleId?: number;
  departmentId?: number;
  isActive?: boolean;
}

export async function getUsersApi(params: GetUsersParams): Promise<{
  users: ManagedUser[];
  pagination: PaginationMeta;
}> {
  const res = await api.get<{
    success: boolean;
    data: { users: ManagedUser[]; pagination: PaginationMeta };
  }>('/users', { params });
  return res.data.data;
}

export async function createUserApi(payload: CreateUserPayload): Promise<ManagedUser> {
  const res = await api.post<{ success: boolean; data: { user: ManagedUser } }>('/users', payload);
  return res.data.data.user;
}

export async function updateUserApi(
  id: number,
  payload: UpdateUserPayload
): Promise<ManagedUser> {
  const res = await api.patch<{ success: boolean; data: { user: ManagedUser } }>(
    `/users/${id}`,
    payload
  );
  return res.data.data.user;
}

export async function deleteUserApi(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function getRolesApi(): Promise<RoleOption[]> {
  const res = await api.get<{ success: boolean; data: { roles: RoleOption[] } }>('/roles');
  return res.data.data.roles;
}

export async function getDepartmentsApi(): Promise<DepartmentOption[]> {
  const res = await api.get<{ success: boolean; data: { departments: DepartmentOption[] } }>(
    '/departments'
  );
  return res.data.data.departments;
}
