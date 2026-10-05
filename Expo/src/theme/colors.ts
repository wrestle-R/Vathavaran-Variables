import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import { useThemePreference } from '@/context/ThemePreferenceContext';

export type AppColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  success: string;
};

export const lightColors: AppColors = {
  background: '#f4f6f1',
  foreground: '#1c281f',
  card: '#fcfdf9',
  cardForeground: '#1c281f',
  primary: '#377d46',
  primaryForeground: '#ffffff',
  secondary: '#e9eee6',
  secondaryForeground: '#1c281f',
  muted: '#e9eee6',
  mutedForeground: '#59665a',
  accent: '#e1eedf',
  accentForeground: '#377d46',
  border: '#d7dfd3',
  input: '#d7dfd3',
  ring: '#377d46',
  destructive: '#a92b20',
  success: '#377d46',
};
export const darkColors: AppColors = {
  background: '#111413',
  foreground: '#edf1eb',
  card: '#181c1a',
  cardForeground: '#edf1eb',
  primary: '#a7d9ad',
  primaryForeground: '#15281a',
  secondary: '#1e2420',
  secondaryForeground: '#edf1eb',
  muted: '#1e2420',
  mutedForeground: '#949f96',
  accent: '#223127',
  accentForeground: '#a7d9ad',
  border: '#2a312d',
  input: '#2a312d',
  ring: '#a7d9ad',
  destructive: '#f1a79e',
  success: '#a7d9ad',
};

export function useAppTheme() {
  const { effectiveScheme, isDark, preference, setPreference, toggleTheme } = useThemePreference();

  return {
    colorScheme: effectiveScheme,
    isDark,
    preference,
    setPreference,
    toggleTheme,
    colors: isDark ? darkColors : lightColors,
  };
}

export const navigationLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.card,
    text: lightColors.foreground,
    border: lightColors.border,
    notification: lightColors.destructive,
  },
};

export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.card,
    text: darkColors.foreground,
    border: darkColors.border,
    notification: darkColors.destructive,
  },
};
