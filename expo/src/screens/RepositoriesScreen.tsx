import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { getEnvList, getRepositories } from '@/lib/api';
import type { GitHubRepository } from '@/types';
import type { RepositoriesStackParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';

type RepositoriesNav = NativeStackNavigationProp<RepositoriesStackParamList, 'Repositories'>;

export function RepositoriesScreen() {
  const navigation = useNavigation<RepositoriesNav>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envCounts, setEnvCounts] = useState<Record<string, number>>({});
  const styles = createStyles(colors);

  const loadRepositories = useCallback(
    async (isRefresh = false) => {
      if (!token) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [repos, envList] = await Promise.all([getRepositories(token), getEnvList(token)]);
        setRepositories(repos);

        const counts = envList.envFiles.reduce<Record<string, number>>((accumulator, envFile) => {
          accumulator[envFile.repoFullName] = (accumulator[envFile.repoFullName] || 0) + 1;
          return accumulator;
        }, {});
        setEnvCounts(counts);
      } catch (incomingError) {
        setError(
          incomingError instanceof Error ? incomingError.message : 'Failed to load repositories.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading repositories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={repositories}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={() => loadRepositories(true)}
        refreshing={refreshing}
        ListEmptyComponent={<Text style={styles.empty}>No repositories found.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              navigation.navigate('RepositoryDetails', { repoFullName: item.full_name })
            }>
            <Text style={styles.repoName}>{item.full_name}</Text>
            <Text style={styles.meta}>
              {item.private ? 'Private' : 'Public'} • ⭐ {item.stargazers_count}
            </Text>
            <Text style={styles.envMeta}>
              {envCounts[item.full_name] || 0} {(envCounts[item.full_name] || 0) === 1 ? 'env file' : 'env files'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: 10,
    },
    loadingText: {
      color: colors.mutedForeground,
    },
    item: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    repoName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.foreground,
    },
    meta: {
      color: colors.mutedForeground,
    },
    envMeta: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
    empty: {
      textAlign: 'center',
      marginTop: 30,
      color: colors.mutedForeground,
    },
    error: {
      color: colors.destructive,
      marginBottom: 10,
    },
  });
