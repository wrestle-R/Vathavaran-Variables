import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { ThemePreferenceProvider } from '@/context/ThemePreferenceContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAppTheme } from '@/theme';

import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useAppTheme();

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
    </>
  );
}
