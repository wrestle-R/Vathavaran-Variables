import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/context/AuthContext';
import { Button, Empty, Eyebrow, LoadingRows, Touch, useStyles } from '@/components/ui';
import { getEnvList } from '@/lib/api';
import type { AppTabParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';
import type { EnvFile } from '@/types';
export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList, 'Dashboard'>>();
  const { token, user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(createStyles);
  const [files, setFiles] = useState<EnvFile[]>([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState('');
  const load = useCallback(
    async (refresh = false) => {
      if (!token) return;
      if (refresh) setRefreshing(true);
      setError('');
      try {
        const data = await getEnvList(token);
        setFiles(data.envFiles);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load workspace');
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
  const repos = useMemo(() => {
    const grouped = new Map<string, { name: string; count: number; updated: string }>();
    for (const file of files) {
      const entry = grouped.get(file.repoFullName);
      if (entry) {
        entry.count++;
        if (file.updatedAt > entry.updated) entry.updated = file.updatedAt;
      } else
        grouped.set(file.repoFullName, {
          name: file.repoFullName,
          count: 1,
          updated: file.updatedAt,
        });
    }
    return [...grouped.values()].sort((a, b) => b.updated.localeCompare(a.updated));
  }, [files]);
  function open(name: string) {
    navigation.navigate('Repos', { screen: 'RepositoryDetails', params: { repoFullName: name } });
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : repos}
        keyExtractor={(item) => item.name}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.greeting}>
              <Eyebrow>YOUR WORKSPACE</Eyebrow>
              <Text style={styles.title}>
                Hey, {user?.name?.split(' ')[0] || user?.login || 'developer'}
                <Text style={{ color: colors.primary }}>.</Text>
              </Text>
              <Text style={styles.subtitle}>The right environment. Within reach.</Text>
            </View>
            <View style={styles.summary}>
              <View style={styles.summaryTop}>
                <Ionicons name="finger-print-outline" color={colors.primary} size={19} />
                <Text style={styles.summaryLabel}>YOUR ENVIRONMENT FILES</Text>
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.total}>
                {files.length}
                <Text style={styles.totalUnit}> files in sync</Text>
              </Text>
              <View style={styles.summaryBottom}>
                <Text style={styles.summaryMeta}>{repos.length} connected repositories</Text>
                <Ionicons name="git-branch-outline" color={colors.primary} size={18} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recently active</Text>
              <Touch onPress={() => navigation.navigate('Repos', { screen: 'Repositories' })}>
                <Text style={styles.seeAll}>All repos ↗</Text>
              </Touch>
            </View>
            {error && (
              <View style={styles.errorBox}>
                <Text accessibilityRole="alert" style={styles.error}>
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
              title="A fresh workspace."
              message="Push your first environment file from the terminal. It’ll appear here, ready for your team."
              action={
                <Button
                  secondary
                  label="Browse repositories"
                  onPress={() => navigation.navigate('Repos', { screen: 'Repositories' })}
                />
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Touch
            accessibilityLabel={`Open ${item.name}`}
            onPress={() => open(item.name)}
            style={styles.repo}>
            <View style={styles.repoIcon}>
              <Ionicons name="folder-outline" color={colors.primary} size={21} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.owner}>{item.name.split('/')[0]} /</Text>
              <Text style={styles.repoName} numberOfLines={1}>
                {item.name.split('/')[1]}
              </Text>
              <Text style={styles.repoMeta}>
                {item.count} environment {item.count === 1 ? 'file' : 'files'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.mutedForeground} size={17} />
          </Touch>
        )}
        ListFooterComponent={
          <View style={styles.tip}>
            <Ionicons name="terminal-outline" color={colors.primary} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Pick up where your terminal left off.</Text>
              <Text style={styles.tipText}>
                Use varte push to add a version. Your team can pull it from anywhere.
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
}
const createStyles = (c: AppColors) => ({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 24, paddingBottom: 35 },
  greeting: { gap: 10, marginBottom: 28 },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 31,
    letterSpacing: -1.4,
    color: c.foreground,
  },
  subtitle: { fontFamily: 'DMsans_400Regular', fontSize: 13, color: c.mutedForeground },
  summary: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 17,
    padding: 23,
  },
  summaryTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 },
  summaryLabel: {
    fontFamily: 'DMsans_500Medium',
    fontSize: 9,
    letterSpacing: 1.1,
    color: c.mutedForeground,
  },
  statusDot: {
    height: 5,
    width: 5,
    backgroundColor: c.primary,
    borderRadius: 5,
    marginLeft: 'auto' as const,
  },
  total: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 54,
    letterSpacing: -3,
    color: c.foreground,
    marginVertical: 14,
  },
  totalUnit: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 13,
    letterSpacing: 0,
    color: c.mutedForeground,
  },
  summaryBottom: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  summaryMeta: { fontFamily: 'DMsans_400Regular', fontSize: 11, color: c.mutedForeground },
  section: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 32,
    marginBottom: 17,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.5,
    color: c.foreground,
  },
  seeAll: { fontFamily: 'DMsans_500Medium', fontSize: 11, color: c.primary },
  repo: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 13,
    padding: 17,
    marginBottom: 11,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  repoIcon: {
    backgroundColor: c.secondary,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  owner: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  repoName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.3,
    color: c.foreground,
    marginTop: 2,
  },
  repoMeta: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 10,
    color: c.mutedForeground,
    marginTop: 5,
  },
  tip: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: c.border,
    flexDirection: 'row' as const,
    gap: 14,
  },
  tipTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: c.foreground },
  tipText: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 11,
    lineHeight: 19,
    color: c.mutedForeground,
    marginTop: 5,
  },
  errorBox: { gap: 12, marginBottom: 15 },
  error: { fontSize: 13, lineHeight: 22, color: c.destructive },
});
