import { useFonts } from 'expo-font';
import { Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { ThemePreferenceProvider } from '@/context/ThemePreferenceContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAppTheme } from '@/theme';


export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    DMsans_400Regular: DMSans_400Regular,
    DMsans_500Medium: DMSans_500Medium,
  });
  if (!fontsLoaded && !fontError) return null;
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
