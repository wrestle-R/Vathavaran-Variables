import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useAuth } from '@/context/AuthContext';
import { getEnvList } from '@/lib/api';
import type { AppTabParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';

type DashboardNavigation = BottomTabNavigationProp<AppTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigation>();
  const { token, user } = useAuth();
  const { colors } = useAppTheme();
  const [repoEnvCounts, setRepoEnvCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors);

  const repoSummaries = useMemo(() => {
    return Object.entries(repoEnvCounts)
      .map(([repoFullName, envCount]) => ({ repoFullName, envCount }))
      .sort((a, b) => {
        if (b.envCount !== a.envCount) {
          return b.envCount - a.envCount;
        }
        return a.repoFullName.localeCompare(b.repoFullName);
      });
  }, [repoEnvCounts]);

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await getEnvList(token);
      const groupedCounts = data.envFiles.reduce<Record<string, number>>((accumulator, envFile) => {
        accumulator[envFile.repoFullName] = (accumulator[envFile.repoFullName] || 0) + 1;
        return accumulator;
      }, {});
      setRepoEnvCounts(groupedCounts);
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
      <Text style={styles.subheading}>Welcome, {user?.login ?? 'developer'}.</Text>

      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>Repositories with env secrets</Text>
        <Text style={styles.cardValue}>{repoSummaries.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loaderText}>Loading repositories with env secrets...</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading ? (
        <FlatList
          data={repoSummaries}
          keyExtractor={(item) => item.repoFullName}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.empty}>No repositories with env secrets yet.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.repoCard}
              onPress={() => {
                const [owner, repo] = item.repoFullName.split('/');
                if (!owner || !repo) {
                  return;
                }
                navigation.navigate('Repos', {
                  screen: 'RepositoryDetails',
                  params: { repoFullName: `${owner}/${repo}` },
                });
              }}>
              <Text style={styles.repoName}>{item.repoFullName}</Text>
              <Text style={styles.repoMeta}>
                {item.envCount} {item.envCount === 1 ? 'env file' : 'env files'}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

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
    subheading: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.foreground,
    },
    cardHeader: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardLabel: {
      color: colors.mutedForeground,
    },
    cardValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.foreground,
    },
    listContainer: {
      gap: 10,
      paddingBottom: 8,
    },
    loaderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 8,
    },
    loaderText: {
      color: colors.mutedForeground,
      fontSize: 13,
    },
    repoCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 4,
      marginBottom: 10,
    },
    repoName: {
      color: colors.foreground,
      fontWeight: '700',
    },
    repoMeta: {
      color: colors.mutedForeground,
      fontSize: 12,
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
    empty: {
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 8,
    },
  });
