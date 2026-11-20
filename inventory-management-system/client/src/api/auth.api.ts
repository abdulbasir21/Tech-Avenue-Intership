import { AuthUser } from '../types/auth';
import { api } from './axios';

export async function loginApi(username: string, password: string): Promise<AuthUser> {
  const res = await api.post<{ success: boolean; data: { user: AuthUser } }>('/auth/login', {
    username,
    password,
  });
  return res.data.data.user;
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMeApi(): Promise<AuthUser> {
  const res = await api.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
  return res.data.data.user;
}
