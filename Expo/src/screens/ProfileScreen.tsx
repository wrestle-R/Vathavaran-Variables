import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/context/AuthContext';
import { Button, Eyebrow, Touch, useStyles } from '@/components/ui';
import { type AppColors, useAppTheme } from '@/theme';
import type { ThemePreference } from '@/context/ThemePreferenceContext';
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useStyles(createStyles);
  const [error, setError] = useState('');
  async function theme(value: ThemePreference) {
    try {
      await setPreference(value);
    } catch {
      setError('Could not save the theme preference');
    }
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Eyebrow>MAKE YOURSELF AT HOME</Eyebrow>
      <Text style={styles.title}>Your account.</Text>
      <View style={styles.profile}>
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.avatar}
            accessibilityLabel="GitHub avatar"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]} />
        )}
        <Text style={styles.name}>{user?.name || user?.login}</Text>
        <Text style={styles.username}>@{user?.login}</Text>
        <View style={styles.connected}>
          <View style={styles.dot} />
          <Text style={styles.connectedText}>Connected with GitHub</Text>
        </View>
      </View>
      <Text style={styles.label}>Appearance</Text>
      <View style={styles.themeCard}>
        <Text style={styles.themeTitle}>A workspace that feels like yours.</Text>
        <Text style={styles.themeSub}>Choose your preferred theme.</Text>
        <View style={styles.options}>
          {(['dark', 'light', 'system'] as ThemePreference[]).map((value) => (
            <View key={value} style={{ flex: 1 }}>
              <Touch
                onPress={() => void theme(value)}
                accessibilityState={{ selected: preference === value }}
                style={[styles.option, preference === value && styles.active]}>
                <Ionicons
                  name={
                    value === 'dark'
                      ? 'moon-outline'
                      : value === 'light'
                        ? 'sunny-outline'
                        : 'phone-portrait-outline'
                  }
                  size={18}
                  color={preference === value ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[styles.optionText, preference === value && { color: colors.primary }]}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Text>
              </Touch>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.label}>Help & context</Text>
      <Touch
        onPress={() =>
          void WebBrowser.openBrowserAsync('https://vathavaran-variable.vercel.app/docs')
        }
        style={styles.row}>
        <Ionicons name="book-outline" color={colors.primary} size={19} />
        <Text style={styles.rowText}>Documentation</Text>
        <Ionicons name="arrow-forward-outline" color={colors.mutedForeground} size={17} />
      </Touch>
      <View style={styles.security}>
        <Ionicons name="finger-print-outline" color={colors.primary} size={22} />
        <Text style={styles.securityText}>
          Files stay encrypted in storage. Your GitHub access determines which repositories you can
          open.
        </Text>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.destructive, marginBottom: 15 }}>
          {error}
        </Text>
      )}
      <Button
        secondary
        label="Sign out"
        icon="log-out-outline"
        onPress={() => {
          void signOut().catch(() => setError('Could not clear the saved session. Try again.'));
        }}
      />
      <Text style={styles.version}>Vathavaran / 2.0.0</Text>
    </ScrollView>
  );
}
const createStyles = (c: AppColors) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: 24, paddingBottom: 40 },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 31,
    letterSpacing: -1.3,
    color: c.foreground,
    marginTop: 12,
  },
  profile: { alignItems: 'center' as const, paddingVertical: 33, marginBottom: 6 },
  avatar: { width: 78, height: 78, borderRadius: 24, marginBottom: 17 },
  name: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.6,
    color: c.foreground,
  },
  username: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 12,
    color: c.mutedForeground,
    marginTop: 5,
  },
  connected: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: c.accent,
  },
  dot: { width: 5, height: 5, borderRadius: 5, backgroundColor: c.primary },
  connectedText: { fontFamily: 'DMsans_500Medium', fontSize: 10, color: c.primary },
  label: {
    fontFamily: 'DMsans_500Medium',
    fontSize: 11,
    color: c.mutedForeground,
    marginTop: 22,
    marginBottom: 12,
  },
  themeCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 20,
  },
  themeTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: c.foreground },
  themeSub: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 11,
    color: c.mutedForeground,
    marginTop: 6,
  },
  options: { flexDirection: 'row' as const, gap: 8, marginTop: 20 },
  option: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    borderRadius: 9,
    alignItems: 'center' as const,
    paddingVertical: 15,
    gap: 9,
  },
  active: { borderColor: c.primary, backgroundColor: c.accent },
  optionText: { fontFamily: 'DMsans_500Medium', fontSize: 11, color: c.mutedForeground },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 13,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 18,
  },
  rowText: { flex: 1, fontFamily: 'DMsans_500Medium', fontSize: 13, color: c.foreground },
  security: { flexDirection: 'row' as const, gap: 12, marginVertical: 30 },
  securityText: {
    flex: 1,
    fontFamily: 'DMsans_400Regular',
    fontSize: 12,
    lineHeight: 21,
    color: c.mutedForeground,
  },
  version: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 10,
    color: c.mutedForeground,
    textAlign: 'center' as const,
    marginTop: 24,
  },
});
