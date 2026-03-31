import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  effectiveScheme: 'light' | 'dark';
  isDark: boolean;
  setPreference: (nextPreference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const STORAGE_KEY = 'app.theme.preference';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restorePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      } finally {
        setHydrated(true);
      }
    };

    restorePreference();
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
  }, []);

  const effectiveScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const toggleTheme = useCallback(async () => {
    const nextPreference = effectiveScheme === 'dark' ? 'light' : 'dark';
    await setPreference(nextPreference);
  }, [effectiveScheme, setPreference]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference,
      effectiveScheme,
      isDark: effectiveScheme === 'dark',
      setPreference,
      toggleTheme,
    }),
    [effectiveScheme, preference, setPreference, toggleTheme]
  );

  if (!hydrated) {
    return null;
  }

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used inside ThemePreferenceProvider');
  }
  return context;
}
