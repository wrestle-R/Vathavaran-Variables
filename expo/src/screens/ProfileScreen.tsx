import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WORKER_BASE_URL } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { type AppColors, useAppTheme } from '@/theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>GitHub User</Text>
        <Text style={styles.value}>{user?.login ?? '-'}</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name ?? '-'}</Text>
        <Text style={styles.label}>Worker URL</Text>
        <Text style={styles.url}>{WORKER_BASE_URL}</Text>
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
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.foreground,
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
    url: {
      color: colors.mutedForeground,
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
