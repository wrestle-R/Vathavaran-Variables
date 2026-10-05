import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';
import { Button, Eyebrow, Touch, useStyles } from '@/components/ui';
import { type AppColors, useAppTheme } from '@/theme';

export function LoginScreen() {
  const { startOAuthInBrowser, signInWithToken, authError } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(createStyles);
  const [busy, setBusy] = useState(false),
    [fallback, setFallback] = useState(false),
    [token, setToken] = useState(''),
    [error, setError] = useState('');
  async function signIn(useToken = false) {
    setBusy(true);
    setError('');
    try {
      if (useToken) {
        if (!token.trim()) throw new Error('Enter a GitHub token to continue');
        await signInWithToken(token.trim());
        setToken('');
      } else await startOAuthInBrowser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.mark}>
              <Ionicons name="terminal-outline" color={colors.primaryForeground} size={24} />
            </View>
            <Text style={styles.wordmark}>vathavaran.</Text>
          </View>
          <View style={styles.art}>
            <View style={styles.artLine}>
              <Ionicons name="git-branch-outline" size={15} color={colors.primary} />
              <Text style={styles.artMeta}>YOUR WORKSPACE / CONNECTED</Text>
              <View style={styles.dot} />
            </View>
            <View style={styles.artFile}>
              <Ionicons name="document-lock-outline" size={24} color={colors.primary} />
              <View>
                <Text style={styles.artName}>.env.production</Text>
                <Text style={styles.artSub}>The right variables. Within reach.</Text>
              </View>
            </View>
            <View style={styles.artCode}>
              <Text style={styles.code}>
                DATABASE_URL <Text style={{ color: colors.primary }}>= ••••••••••••••</Text>
              </Text>
              <Text style={styles.code}>
                API_SECRET <Text style={{ color: colors.primary }}>= ••••••••••••••</Text>
              </Text>
            </View>
          </View>
          <View style={styles.copy}>
            <Eyebrow>Your environment, in your pocket</Eyebrow>
            <Text style={styles.title}>
              Build anywhere.<Text style={{ color: colors.primary }}>{'\n'}Stay in sync.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Your team’s environment files, connected to GitHub. Ready when you are.
            </Text>
          </View>
          <Button
            label={busy ? 'Connecting…' : 'Continue with GitHub'}
            icon="logo-github"
            onPress={() => void signIn()}
            disabled={busy}
          />
          <Text style={styles.note}>Sign in with the GitHub account you already use.</Text>
          <Touch onPress={() => setFallback(!fallback)} style={styles.fallback}>
            <Text style={styles.fallbackText}>
              {fallback ? 'Hide token sign-in' : 'Use a personal access token'}
            </Text>
            <Ionicons
              name={fallback ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.mutedForeground}
            />
          </Touch>
          {fallback && (
            <View style={{ gap: 12 }}>
              <TextInput
                secureTextEntry
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="GitHub personal access token"
                placeholderTextColor={colors.mutedForeground}
                style={styles.input}
                accessibilityLabel="GitHub token"
              />
              <Button
                secondary
                label="Sign in with token"
                onPress={() => void signIn(true)}
                disabled={busy}
              />
            </View>
          )}
          {(error || authError) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error || authError}
            </Text>
          )}
          <View style={styles.bottom}>
            <Ionicons name="finger-print-outline" size={15} color={colors.mutedForeground} />
            <Text style={styles.bottomText}>Encrypted files. Verified repository access.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const createStyles = (c: AppColors) => ({
  safe: { flex: 1, backgroundColor: c.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 25, paddingBottom: 30 },
  brand: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  mark: {
    backgroundColor: c.primary,
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  wordmark: { fontFamily: 'Manrope_700Bold', fontSize: 23, letterSpacing: -1, color: c.foreground },
  art: {
    backgroundColor: c.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    marginTop: 40,
    marginBottom: 35,
  },
  artLine: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 },
  artMeta: {
    fontFamily: 'DMsans_500Medium',
    fontSize: 8,
    letterSpacing: 1,
    color: c.mutedForeground,
  },
  dot: {
    marginLeft: 'auto' as const,
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: c.primary,
  },
  artFile: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    marginVertical: 23,
  },
  artName: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.foreground },
  artSub: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground, marginTop: 4 },
  artCode: { backgroundColor: c.background, padding: 13, borderRadius: 8, gap: 8 },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: c.mutedForeground,
  },
  copy: { gap: 16, marginBottom: 28 },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 42,
    letterSpacing: -2,
    lineHeight: 49,
    color: c.foreground,
  },
  subtitle: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 14,
    lineHeight: 24,
    color: c.mutedForeground,
    maxWidth: 320,
  },
  note: {
    textAlign: 'center' as const,
    color: c.mutedForeground,
    fontFamily: 'DMsans_400Regular',
    fontSize: 11,
    marginTop: 14,
  },
  fallback: {
    paddingVertical: 22,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  fallbackText: { fontFamily: 'DMsans_500Medium', fontSize: 11, color: c.mutedForeground },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    borderRadius: 12,
    color: c.foreground,
    padding: 15,
    fontSize: 13,
  },
  error: { color: c.destructive, fontSize: 13, lineHeight: 22, marginTop: 15 },
  bottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 25,
  },
  bottomText: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
});
