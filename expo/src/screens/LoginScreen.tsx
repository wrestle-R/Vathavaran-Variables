import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { type AppColors, useAppTheme } from '@/theme';

export function LoginScreen() {
  const { signInWithToken, startOAuthInBrowser, authError } = useAuth();
  const { colors, isDark } = useAppTheme();
  const [tokenInput, setTokenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const styles = createStyles(colors);
  const logoSource = isDark
    ? require('../../assets/logo-mark-light.png')
    : require('../../assets/logo-mark-dark.png');

  const handleTokenLogin = async () => {
    if (!tokenInput.trim()) {
      setLocalError('Paste your GitHub token first.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await signInWithToken(tokenInput.trim());
      setTokenInput('');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Token sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Vathavaran Mobile</Text>
      <Text style={styles.subtitle}>
        Login with GitHub OAuth. Token fallback is available if needed.
      </Text>

      <Pressable style={styles.primaryButton} onPress={startOAuthInBrowser}>
        <Text style={styles.primaryButtonText}>Open GitHub OAuth</Text>
      </Pressable>

      <Text style={styles.helper}>Use token fallback only if OAuth fails on your device:</Text>
      <TextInput
        style={styles.input}
        value={tokenInput}
        onChangeText={setTokenInput}
        placeholder="Paste GitHub token"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable style={styles.secondaryButton} onPress={handleTokenLogin} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.secondaryButtonText}>Sign in with token</Text>
        )}
      </Pressable>

      {(localError || authError) && <Text style={styles.error}>{localError ?? authError}</Text>}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      gap: 14,
      backgroundColor: colors.background,
    },
    logo: {
      width: 88,
      height: 88,
      alignSelf: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.foreground,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.mutedForeground,
      marginBottom: 8,
      textAlign: 'center',
    },
    helper: {
      color: colors.mutedForeground,
      marginTop: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.foreground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.primaryForeground,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.secondaryForeground,
      fontWeight: '600',
    },
    error: {
      color: colors.destructive,
    },
  });
