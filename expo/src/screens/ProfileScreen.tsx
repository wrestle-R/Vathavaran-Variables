import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { type AppColors, useAppTheme } from '@/theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, preference, setPreference, toggleTheme, isDark } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>GitHub User</Text>
        <Text style={styles.value}>{user?.login ?? '-'}</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name ?? '-'}</Text>

        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeRow}>
          <Pressable
            onPress={() => {
              void setPreference('light');
            }}
            style={[styles.chip, preference === 'light' && styles.chipActive]}>
            <Text style={[styles.chipText, preference === 'light' && styles.chipTextActive]}>Light</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void setPreference('dark');
            }}
            style={[styles.chip, preference === 'dark' && styles.chipActive]}>
            <Text style={[styles.chipText, preference === 'dark' && styles.chipTextActive]}>Dark</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void setPreference('system');
            }}
            style={[styles.chip, preference === 'system' && styles.chipActive]}>
            <Text style={[styles.chipText, preference === 'system' && styles.chipTextActive]}>System</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.quickToggle}
          onPress={() => {
            void toggleTheme();
          }}>
          <Text style={styles.quickToggleText}>Quick toggle ({isDark ? 'Dark' : 'Light'})</Text>
        </Pressable>
      </View>
      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      gap: 14,
      backgroundColor: colors.background,
    },
    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
    value: {
      color: colors.foreground,
      fontWeight: '700',
      marginBottom: 4,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.background,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.foreground,
      fontSize: 12,
      fontWeight: '600',
    },
    chipTextActive: {
      color: colors.primaryForeground,
    },
    quickToggle: {
      marginTop: 2,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
      backgroundColor: colors.secondary,
    },
    quickToggleText: {
      color: colors.secondaryForeground,
      fontWeight: '600',
      fontSize: 12,
    },
    logoutButton: {
      backgroundColor: colors.destructive,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    logoutText: {
      color: '#ffffff',
      fontWeight: '700',
    },
  });
