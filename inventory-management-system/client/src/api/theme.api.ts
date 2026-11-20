import { ThemePresetKey } from '../theme/presets';
import { api } from './axios';

export interface ThemeSettingsResponse {
  activeTheme: ThemePresetKey;
  customPrimaryColor: string | null;
}

export async function getThemeApi(): Promise<ThemeSettingsResponse> {
  const res = await api.get<{ success: boolean; data: ThemeSettingsResponse }>('/theme');
  return res.data.data;
}

export async function updateThemeApi(
  payload: ThemeSettingsResponse
): Promise<ThemeSettingsResponse> {
  const res = await api.put<{ success: boolean; data: ThemeSettingsResponse }>('/theme', payload);
  return res.data.data;
}
