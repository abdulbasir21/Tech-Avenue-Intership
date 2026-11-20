export type ThemePresetKey = 'default' | 'emerald' | 'purple' | 'crimson' | 'custom';

export interface ThemeTokens {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  rowTint: string;
}

export interface ThemePresetDefinition extends ThemeTokens {
  key: Exclude<ThemePresetKey, 'custom'>;
  label: string;
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    key: 'default',
    label: 'Default',
    primary: '#1E3A8A',
    primaryHover: '#172E6E',
    primarySoft: '#EAF0FF',
    rowTint: '#F7F9FF',
  },
  {
    key: 'emerald',
    label: 'Emerald',
    primary: '#047857',
    primaryHover: '#065F46',
    primarySoft: '#E6F6EF',
    rowTint: '#F5FBF8',
  },
  {
    key: 'purple',
    label: 'Purple',
    primary: '#6D28D9',
    primaryHover: '#5B21B6',
    primarySoft: '#F0EAFE',
    rowTint: '#F8F5FF',
  },
  {
    key: 'crimson',
    label: 'Crimson',
    primary: '#BE123C',
    primaryHover: '#9F1239',
    primarySoft: '#FDEBF0',
    rowTint: '#FEF6F8',
  },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const THEME_CACHE_KEY = 'ims_theme_cache';

export function isValidHexColor(hex: string): boolean {
  return HEX_REGEX.test(hex.trim());
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function mixWithWhite(hex: string, whiteRatio: number): string {
  const { r, g, b } = hexToRgb(hex);
  const colorRatio = 1 - whiteRatio;
  return rgbToHex(
    r * colorRatio + 255 * whiteRatio,
    g * colorRatio + 255 * whiteRatio,
    b * colorRatio + 255 * whiteRatio
  );
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function deriveCustomTheme(hex: string): ThemeTokens {
  const normalized = isValidHexColor(hex) ? hex.trim().toUpperCase() : '#1E3A8A';
  return {
    primary: normalized,
    primaryHover: darkenHex(normalized, 0.15),
    primarySoft: mixWithWhite(normalized, 0.9),
    rowTint: mixWithWhite(normalized, 0.96),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getWhiteContrastRatio(hex: string): number {
  if (!isValidHexColor(hex)) return 0;
  const lum = relativeLuminance(hex.trim());
  return (1 + 0.05) / (lum + 0.05);
}

export function isReadableWithWhiteText(hex: string): boolean {
  return getWhiteContrastRatio(hex) >= 4.5;
}

export function resolveThemeTokens(
  activeTheme: ThemePresetKey,
  customPrimaryColor: string | null
): ThemeTokens {
  if (activeTheme === 'custom' && customPrimaryColor && isValidHexColor(customPrimaryColor)) {
    return deriveCustomTheme(customPrimaryColor);
  }
  const preset = THEME_PRESETS.find((p) => p.key === activeTheme);
  return preset ?? THEME_PRESETS[0];
}

export function applyThemeToDocument(
  activeTheme: ThemePresetKey,
  customPrimaryColor: string | null
): void {
  const tokens = resolveThemeTokens(activeTheme, customPrimaryColor);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', tokens.primary);
  root.style.setProperty('--color-primary-hover', tokens.primaryHover);
  root.style.setProperty('--color-primary-soft', tokens.primarySoft);
  root.style.setProperty('--color-row-tint', tokens.rowTint);
}

export function readCachedTheme(): {
  activeTheme: ThemePresetKey;
  customPrimaryColor: string | null;
} | null {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.activeTheme === 'string') {
      return {
        activeTheme: parsed.activeTheme as ThemePresetKey,
        customPrimaryColor:
          typeof parsed.customPrimaryColor === 'string' ? parsed.customPrimaryColor : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCachedTheme(
  activeTheme: ThemePresetKey,
  customPrimaryColor: string | null
): void {
  try {
    localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({ activeTheme, customPrimaryColor })
    );
  } catch {
    // Ignore storage errors
  }
}
