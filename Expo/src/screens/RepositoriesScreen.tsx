import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { Button, Empty, Eyebrow, LoadingRows, Touch, useStyles } from '@/components/ui';
import { getEnvList, getRepositories } from '@/lib/api';
import type { GitHubRepository } from '@/types';
import type { RepositoriesStackParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';
export function RepositoriesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RepositoriesStackParamList, 'Repositories'>>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(createStyles);
  const [repos, setRepos] = useState<GitHubRepository[]>([]),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState(false),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState('');
  const load = useCallback(
    async (refresh = false) => {
      if (!token) return;
      if (refresh) setRefreshing(true);
      setError('');
      try {
        const [repos, data] = await Promise.all([getRepositories(token), getEnvList(token)]);
        setRepos(repos);
        setCounts(
          data.envFiles.reduce<Record<string, number>>((acc, file) => {
            acc[file.repoFullName] = (acc[file.repoFullName] || 0) + 1;
            return acc;
          }, {})
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load repositories');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );
  useEffect(() => {
    void load();
  }, [load]);
  const visible = useMemo(
    () =>
      repos.filter(
        (repo) =>
          repo.full_name.toLowerCase().includes(query.toLowerCase()) &&
          (!filter || counts[repo.full_name])
      ),
    [repos, query, filter, counts]
  );
  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Eyebrow>CONNECTED TO GITHUB</Eyebrow>
            <Text style={styles.title}>Your repositories.</Text>
            <Text style={styles.subtitle}>A home for every environment.</Text>
            <View style={styles.search}>
              <Ionicons name="search-outline" color={colors.mutedForeground} size={17} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Find a repository…"
                placeholderTextColor={colors.mutedForeground}
                style={styles.searchInput}
                accessibilityLabel="Search repositories"
                autoCorrect={false}
              />
            </View>
            <View style={styles.filters}>
              <Touch
                onPress={() => setFilter(false)}
                style={[styles.filter, !filter && styles.filterActive]}
                accessibilityState={{ selected: !filter }}>
                <Text style={[styles.filterText, !filter && styles.filterTextActive]}>
                  All repos · {repos.length}
                </Text>
              </Touch>
              <Touch
                onPress={() => setFilter(true)}
                style={[styles.filter, filter && styles.filterActive]}
                accessibilityState={{ selected: filter }}>
                <Text style={[styles.filterText, filter && styles.filterTextActive]}>
                  With env files
                </Text>
              </Touch>
            </View>
            {error && (
              <View style={{ gap: 12, marginBottom: 18 }}>
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
                <Button secondary label="Try again" onPress={() => void load(true)} />
              </View>
            )}
            {loading && <LoadingRows />}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <Empty
              title={query ? 'No matches.' : 'Nothing here yet.'}
              message={
                query
                  ? 'Try another repository name or clear the filters.'
                  : 'Repositories you can access on GitHub will appear here.'
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Touch
            onPress={() =>
              navigation.navigate('RepositoryDetails', { repoFullName: item.full_name })
            }
            accessibilityLabel={`Open ${item.full_name}`}
            style={styles.card}>
            <View style={styles.cardTop}>
              <Ionicons name="folder-outline" color={colors.primary} size={23} />
              <View style={styles.badge}>
                <Ionicons
                  name={item.private ? 'lock-closed-outline' : 'globe-outline'}
                  color={colors.mutedForeground}
                  size={10}
                />
                <Text style={styles.badgeText}>{item.private ? 'Private' : 'Public'}</Text>
              </View>
            </View>
            <Text style={styles.owner}>{item.full_name.split('/')[0]} /</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'Your project’s environment files, in one place.'}
            </Text>
            <View style={styles.cardBottom}>
              <Text style={styles.fileCount}>{counts[item.full_name] || 0} env files</Text>
              <View style={styles.language}>
                <Text style={styles.languageText}>{item.language || 'Repository'}</Text>
                <Ionicons name="arrow-forward-outline" color={colors.mutedForeground} size={14} />
              </View>
            </View>
          </Touch>
        )}
      />
    </View>
  );
}
const createStyles = (c: AppColors) => ({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 24, paddingBottom: 35 },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 30,
    color: c.foreground,
    letterSpacing: -1.3,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 9,
  },
  search: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 11,
    backgroundColor: c.card,
    paddingHorizontal: 15,
    marginTop: 25,
  },
  searchInput: {
    flex: 1,
    color: c.foreground,
    fontFamily: 'DMsans_400Regular',
    fontSize: 13,
    paddingVertical: 15,
  },
  filters: { flexDirection: 'row' as const, gap: 10, marginVertical: 20 },
  filter: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterActive: { backgroundColor: c.accent, borderColor: c.primary },
  filterText: { fontFamily: 'DMsans_500Medium', fontSize: 11, color: c.mutedForeground },
  filterTextActive: { color: c.primary },
  card: {
    padding: 22,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.card,
    marginBottom: 13,
  },
  cardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 18,
  },
  badge: {
    flexDirection: 'row' as const,
    gap: 4,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: 'DMsans_400Regular', fontSize: 9, color: c.mutedForeground },
  owner: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  name: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 19,
    letterSpacing: -0.5,
    color: c.foreground,
    marginTop: 4,
  },
  description: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 12,
    lineHeight: 20,
    color: c.mutedForeground,
    marginTop: 10,
    marginBottom: 19,
  },
  cardBottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  fileCount: { fontFamily: 'DMsans_500Medium', fontSize: 10, color: c.primary },
  language: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  languageText: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  error: { fontSize: 13, color: c.destructive, lineHeight: 22 },
});
