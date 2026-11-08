import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light';

interface ThemePreferenceContextValue {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const themeMode: ThemeMode = 'light';

  useEffect(() => {
    Appearance.setColorScheme('light');
  }, [themeMode]);

  // Retained for compatibility with existing consumers while the application
  // uses a deliberately single, light appearance.
  const toggleTheme = () => undefined;

  const value = useMemo(() => ({ themeMode, toggleTheme }), [themeMode]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return context;
}
