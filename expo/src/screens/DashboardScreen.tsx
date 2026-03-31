import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getEnvList } from '@/lib/api';
import { type AppColors, useAppTheme } from '@/theme';

export function DashboardScreen() {
  const { token, user } = useAuth();
  const { colors } = useAppTheme();
  const [envCount, setEnvCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors);

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await getEnvList(token);
      setEnvCount(data.envFiles.length);
    } catch (incomingError) {
      setError(incomingError instanceof Error ? incomingError.message : 'Failed to load summary.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subheading}>Welcome, {user?.login ?? 'developer'}.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Saved env files</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.cardValue}>{envCount}</Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Pressable style={styles.reloadButton} onPress={loadSummary}>
        <Text style={styles.reloadText}>Refresh summary</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      gap: 16,
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.foreground,
    },
    subheading: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLabel: {
      color: colors.mutedForeground,
    },
    cardValue: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.foreground,
    },
    reloadButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    reloadText: {
      color: colors.primaryForeground,
      fontWeight: '700',
    },
    error: {
      color: colors.destructive,
    },
  });
