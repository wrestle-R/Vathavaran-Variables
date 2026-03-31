import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAppTheme } from '@/theme';

import './global.css';

export default function App() {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
