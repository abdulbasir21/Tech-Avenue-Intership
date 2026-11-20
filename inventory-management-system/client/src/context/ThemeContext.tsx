import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { getThemeApi, updateThemeApi } from '../api/theme.api';
import {
  applyThemeToDocument,
  readCachedTheme,
  ThemePresetKey,
  writeCachedTheme,
} from '../theme/presets';

interface ThemeContextValue {
  activeTheme: ThemePresetKey;
  customPrimaryColor: string | null;
  loading: boolean;
  previewTheme: (theme: ThemePresetKey, customHex: string | null) => void;
  resetPreview: () => void;
  saveTheme: (theme: ThemePresetKey, customHex: string | null) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const cached = readCachedTheme();
  const [activeTheme, setActiveTheme] = useState<ThemePresetKey>(cached?.activeTheme ?? 'default');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | null>(
    cached?.customPrimaryColor ?? null
  );
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    applyThemeToDocument(activeTheme, customPrimaryColor);
  }, [activeTheme, customPrimaryColor]);

  useEffect(() => {
    let mounted = true;
    const loadTheme = async () => {
      try {
        const remote = await getThemeApi();
        if (!mounted) return;
        setActiveTheme(remote.activeTheme);
        setCustomPrimaryColor(remote.customPrimaryColor);
        applyThemeToDocument(remote.activeTheme, remote.customPrimaryColor);
        writeCachedTheme(remote.activeTheme, remote.customPrimaryColor);
      } catch {
        if (!mounted) return;
        setActiveTheme('default');
        setCustomPrimaryColor(null);
        applyThemeToDocument('default', null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadTheme();
    return () => {
      mounted = false;
    };
  }, []);

  const previewTheme = useCallback((theme: ThemePresetKey, customHex: string | null) => {
    applyThemeToDocument(theme, customHex);
  }, []);

  const resetPreview = useCallback(() => {
    applyThemeToDocument(activeTheme, customPrimaryColor);
  }, [activeTheme, customPrimaryColor]);

  const saveTheme = useCallback(async (theme: ThemePresetKey, customHex: string | null) => {
    const saved = await updateThemeApi({
      activeTheme: theme,
      customPrimaryColor: theme === 'custom' ? customHex : null,
    });
    setActiveTheme(saved.activeTheme);
    setCustomPrimaryColor(saved.customPrimaryColor);
    applyThemeToDocument(saved.activeTheme, saved.customPrimaryColor);
    writeCachedTheme(saved.activeTheme, saved.customPrimaryColor);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        customPrimaryColor,
        loading,
        previewTheme,
        resetPreview,
        saveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
