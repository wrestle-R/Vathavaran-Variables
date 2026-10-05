import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Button, Empty, Eyebrow, LoadingRows, Touch, useStyles } from '@/components/ui';
import { decryptEnvContent } from '@/lib/envCrypto';
import { getEnvList } from '@/lib/api';
import type { EnvFile } from '@/types';
import type { RepositoriesStackParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';
export function RepositoryDetailsScreen() {
  const { params } = useRoute<RouteProp<RepositoriesStackParamList, 'RepositoryDetails'>>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(createStyles);
  const [files, setFiles] = useState<EnvFile[]>([]),
    [directory, setDirectory] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(''),
    [active, setActive] = useState<EnvFile | null>(null),
    [plain, setPlain] = useState<string | null>(null),
    [decrypting, setDecrypting] = useState(false),
    [copied, setCopied] = useState(false),
    [reduced, setReduced] = useState(false);
  const load = useCallback(
    async (refresh = false) => {
      if (!token) return;
      if (refresh) setRefreshing(true);
      setError('');
      try {
        const data = await getEnvList(token, params.repoFullName);
        setFiles(data.envFiles);
        setActive(null);
        setPlain(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load files');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, params.repoFullName]
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const state = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        setActive(null);
        setPlain(null);
        setCopied(false);
      }
    });
    return () => {
      motion.remove();
      state.remove();
    };
  }, []);
  const directories = Array.from(new Set(files.map((f) => f.directory || ''))).sort();
  const visible = files.filter((f) => directory === null || (f.directory || '') === directory);
  async function open(file: EnvFile) {
    if (!token) return;
    setDecrypting(true);
    setError('');
    setPlain(null);
    setCopied(false);
    try {
      const text = await decryptEnvContent(file.content, file.isEncrypted, token);
      setPlain(text);
      setActive(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decrypt file');
    } finally {
      setDecrypting(false);
    }
  }
  async function copy() {
    if (plain === null) return;
    try {
      await Clipboard.setStringAsync(plain);
      setCopied(true);
    } catch {
      setError('Could not copy this file');
    }
  }
  function close() {
    setActive(null);
    setPlain(null);
    setCopied(false);
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Eyebrow>{params.repoFullName.split('/')[0]} /</Eyebrow>
            <Text style={styles.title}>{params.repoFullName.split('/')[1]}</Text>
            <Text style={styles.subtitle}>
              {files.length} environment files. One source of context.
            </Text>
            <View style={styles.security}>
              <Ionicons name="finger-print-outline" size={17} color={colors.primary} />
              <Text style={styles.securityText}>
                Encrypted in storage. Decrypted on your device.
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.folders}>
              <Touch
                onPress={() => setDirectory(null)}
                accessibilityState={{ selected: directory === null }}
                style={[styles.chip, directory === null && styles.chipActive]}>
                <Text style={[styles.chipText, directory === null && { color: colors.primary }]}>
                  All files
                </Text>
              </Touch>
              {directories.map((dir) => (
                <Touch
                  key={dir}
                  onPress={() => setDirectory(dir)}
                  accessibilityState={{ selected: directory === dir }}
                  style={[styles.chip, directory === dir && styles.chipActive]}>
                  <Ionicons
                    name="folder-outline"
                    size={13}
                    color={directory === dir ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.chipText, directory === dir && { color: colors.primary }]}>
                    {dir || 'Root'}
                  </Text>
                </Touch>
              ))}
            </ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Environment files</Text>
              <Text style={styles.sectionMeta}>{visible.length} available</Text>
            </View>
            {error && (
              <View style={{ gap: 12, marginBottom: 18 }}>
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
                <Button secondary label="Try again" onPress={() => void load(true)} />
              </View>
            )}
            {loading && <LoadingRows />}
            {decrypting && (
              <View style={styles.decrypting}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.subtitle}>Decrypting your file…</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <Empty
              title="A clean slate."
              message="Push an environment file with varte, or upload one in the web workspace."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Touch
            onPress={() => void open(item)}
            disabled={decrypting}
            accessibilityLabel={`Open ${item.envName}`}
            style={styles.file}>
            <View style={styles.fileTop}>
              <View style={styles.fileIcon}>
                <Ionicons name="document-lock-outline" color={colors.primary} size={21} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName}>{item.envName}</Text>
                <Text style={styles.directory}>{item.directory || 'Repository root'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.fileBottom}>
              <Text style={styles.fileMeta}>by {item.userName}</Text>
              <Text style={styles.fileMeta}>
                {new Date(item.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </Touch>
        )}
      />
      <Modal
        visible={active !== null}
        animationType={reduced ? 'none' : 'slide'}
        transparent
        onRequestClose={close}>
        <View style={styles.scrim}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Eyebrow>DECRYPTED ON THIS DEVICE</Eyebrow>
                <Text style={styles.sheetTitle}>{active?.envName}</Text>
                <Text style={styles.directory}>{active?.directory || 'Repository root'}</Text>
              </View>
              <Touch onPress={close} accessibilityLabel="Close file" style={styles.close}>
                <Ionicons name="close-outline" size={23} color={colors.foreground} />
              </Touch>
            </View>
            <ScrollView style={styles.codeBox} contentContainerStyle={styles.codeContent}>
              <Text selectable style={styles.code}>
                {plain}
              </Text>
            </ScrollView>
            <Button
              label={copied ? 'Copied to clipboard' : 'Copy file contents'}
              icon={copied ? 'checkmark-outline' : 'copy-outline'}
              onPress={() => void copy()}
            />
            <Text style={styles.clipboardNote}>
              Copied secrets remain in your device clipboard until replaced.
            </Text>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
const createStyles = (c: AppColors) => ({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 24, paddingBottom: 35 },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 30,
    letterSpacing: -1.3,
    color: c.foreground,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 12,
    color: c.mutedForeground,
    marginTop: 9,
  },
  security: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 9,
    marginVertical: 23,
  },
  securityText: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  folders: { gap: 8, paddingBottom: 5 },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
  },
  chipActive: { backgroundColor: c.accent, borderColor: c.primary },
  chipText: { fontFamily: 'DMsans_500Medium', fontSize: 11, color: c.mutedForeground },
  section: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginVertical: 22,
  },
  sectionTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 17, color: c.foreground },
  sectionMeta: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  file: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 13,
    padding: 18,
    marginBottom: 12,
  },
  fileTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 13 },
  fileIcon: {
    backgroundColor: c.secondary,
    width: 43,
    height: 43,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fileName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.3,
    color: c.foreground,
  },
  directory: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 10,
    color: c.mutedForeground,
    marginTop: 5,
  },
  fileBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    borderTopWidth: 1,
    borderTopColor: c.border,
    marginTop: 17,
    paddingTop: 13,
  },
  fileMeta: { fontFamily: 'DMsans_400Regular', fontSize: 10, color: c.mutedForeground },
  error: { color: c.destructive, fontSize: 13, lineHeight: 22 },
  decrypting: {
    flexDirection: 'row' as const,
    gap: 10,
    alignItems: 'center' as const,
    marginBottom: 15,
  },
  scrim: { flex: 1, backgroundColor: '#070e0bb3', justifyContent: 'flex-end' as const },
  sheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '88%' as const,
    borderWidth: 1,
    borderColor: c.border,
  },
  handle: {
    height: 4,
    width: 32,
    borderRadius: 4,
    backgroundColor: c.border,
    alignSelf: 'center' as const,
    marginBottom: 25,
  },
  sheetHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 22,
  },
  sheetTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.5,
    color: c.foreground,
    marginTop: 10,
  },
  close: { backgroundColor: c.secondary, padding: 8, borderRadius: 10 },
  codeBox: {
    backgroundColor: c.background,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 20,
    maxHeight: 350,
  },
  codeContent: { padding: 18 },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 22,
    color: c.foreground,
  },
  clipboardNote: {
    fontFamily: 'DMsans_400Regular',
    fontSize: 10,
    lineHeight: 17,
    color: c.mutedForeground,
    marginTop: 13,
    textAlign: 'center' as const,
  },
});
