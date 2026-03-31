import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';

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
  background: '#ffffff',
  foreground: '#18181b',
  card: '#ffffff',
  cardForeground: '#18181b',
  primary: '#18181b',
  primaryForeground: '#fafafa',
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  accent: '#f4f4f5',
  accentForeground: '#18181b',
  border: '#e4e4e7',
  input: '#e4e4e7',
  ring: '#a1a1aa',
  destructive: '#dc2626',
  success: '#16a34a',
};

export const darkColors: AppColors = {
  background: '#18181b',
  foreground: '#fafafa',
  card: '#27272a',
  cardForeground: '#fafafa',
  primary: '#e4e4e7',
  primaryForeground: '#18181b',
  secondary: '#3f3f46',
  secondaryForeground: '#fafafa',
  muted: '#3f3f46',
  mutedForeground: '#a1a1aa',
  accent: '#3f3f46',
  accentForeground: '#fafafa',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#71717a',
  destructive: '#f87171',
  success: '#4ade80',
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colorScheme: isDark ? 'dark' : 'light',
    isDark,
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
