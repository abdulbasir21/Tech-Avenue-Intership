import { prisma } from '../config/prisma';

export type ThemePresetKey = 'default' | 'emerald' | 'purple' | 'crimson' | 'custom';

export interface ThemeSettingsDto {
  activeTheme: ThemePresetKey;
  customPrimaryColor: string | null;
}

const VALID_THEMES: ThemePresetKey[] = ['default', 'emerald', 'purple', 'crimson', 'custom'];

function normalizeThemeKey(raw: string): ThemePresetKey {
  return VALID_THEMES.includes(raw as ThemePresetKey) ? (raw as ThemePresetKey) : 'default';
}

export async function getThemeSettings(): Promise<ThemeSettingsDto> {
  const row = await prisma.themeSetting.findFirst({
    orderBy: { id: 'asc' },
    select: {
      activeTheme: true,
      customPrimaryColor: true,
    },
  });

  if (!row) {
    return {
      activeTheme: 'default',
      customPrimaryColor: null,
    };
  }

  return {
    activeTheme: normalizeThemeKey(row.activeTheme),
    customPrimaryColor: row.customPrimaryColor,
  };
}

export async function updateThemeSettings(
  userId: number,
  input: {
    activeTheme: ThemePresetKey;
    customPrimaryColor?: string | null;
  }
): Promise<ThemeSettingsDto> {
  const normalizedHex =
    input.activeTheme === 'custom' && input.customPrimaryColor
      ? input.customPrimaryColor.trim().toUpperCase()
      : null;

  const existing = await prisma.themeSetting.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  const saved = existing
    ? await prisma.themeSetting.update({
        where: { id: existing.id },
        data: {
          activeTheme: input.activeTheme,
          customPrimaryColor: normalizedHex,
          updatedByUserId: userId,
        },
        select: {
          activeTheme: true,
          customPrimaryColor: true,
        },
      })
    : await prisma.themeSetting.create({
        data: {
          activeTheme: input.activeTheme,
          customPrimaryColor: normalizedHex,
          updatedByUserId: userId,
        },
        select: {
          activeTheme: true,
          customPrimaryColor: true,
        },
      });

  return {
    activeTheme: normalizeThemeKey(saved.activeTheme),
    customPrimaryColor: saved.customPrimaryColor,
  };
}
