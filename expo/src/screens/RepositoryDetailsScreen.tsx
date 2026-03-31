import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { decryptEnvContent } from '@/lib/envCrypto';
import { getEnvList } from '@/lib/api';
import type { EnvFile } from '@/types';
import type { RepositoriesStackParamList } from '@/navigation/AppNavigator';
import { type AppColors, useAppTheme } from '@/theme';

type DetailsRoute = RouteProp<RepositoriesStackParamList, 'RepositoryDetails'>;

export function RepositoryDetailsScreen() {
  const route = useRoute<DetailsRoute>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [files, setFiles] = useState<EnvFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState('/');
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({});
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const styles = createStyles(colors);

  const sortedFiles = useMemo(
    () =>
      [...files].sort(
        (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
      ),
    [files]
  );

  const directories = useMemo(() => {
    const unique = new Set(sortedFiles.map((file) => file.directory || '/'));
    const list = Array.from(unique).sort((first, second) => {
      if (first === '/') return -1;
      if (second === '/') return 1;
      return first.localeCompare(second);
    });
    return list;
  }, [sortedFiles]);

  const visibleFiles = useMemo(
    () => sortedFiles.filter((file) => (file.directory || '/') === selectedDirectory),
    [selectedDirectory, sortedFiles]
  );

  const activeEnv = useMemo(
    () => sortedFiles.find((file) => file.id === activeEnvId) ?? null,
    [activeEnvId, sortedFiles]
  );

  useEffect(() => {
    if (directories.length === 0) {
      setSelectedDirectory('/');
      return;
    }
    if (!directories.includes(selectedDirectory)) {
      setSelectedDirectory(directories[0]);
    }
  }, [directories, selectedDirectory]);

  const loadFiles = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getEnvList(token, route.params.repoFullName);
        setFiles(data.envFiles);
        setActiveEnvId(null);
      } catch (incomingError) {
        setError(
          incomingError instanceof Error ? incomingError.message : 'Failed to load env files.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [route.params.repoFullName, token]
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const openEnv = useCallback(async (file: EnvFile) => {
    setCopied(false);
    setActiveEnvId(file.id);

    if (!file.isEncrypted || decryptedContents[file.id]) {
      if (!file.isEncrypted && !decryptedContents[file.id]) {
        setDecryptedContents((previous) => ({ ...previous, [file.id]: file.content }));
      }
      return;
    }

    try {
      setDecryptingId(file.id);
      const decrypted = await decryptEnvContent(file.content, file.isEncrypted);
      setDecryptedContents((previous) => ({ ...previous, [file.id]: decrypted }));
    } catch (incomingError) {
      setError(incomingError instanceof Error ? incomingError.message : 'Failed to decrypt env file.');
    } finally {
      setDecryptingId(null);
    }
  }, [decryptedContents]);

  const copyActiveEnv = useCallback(async () => {
    if (!activeEnv) {
      return;
    }

    const content = decryptedContents[activeEnv.id] || (!activeEnv.isEncrypted ? activeEnv.content : '');
    if (!content) {
      return;
    }

    await Clipboard.setStringAsync(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [activeEnv, decryptedContents]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading env files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{route.params.repoFullName}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.refreshButton} onPress={() => loadFiles(true)}>
        <Text style={styles.refreshButtonText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Folders</Text>
      <FlatList
        data={directories}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.folderList}
        ListEmptyComponent={<Text style={styles.empty}>No folders found.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedDirectory(item)}
            style={[styles.folderChip, selectedDirectory === item && styles.folderChipActive]}>
            <Text
              style={[
                styles.folderChipText,
                selectedDirectory === item && styles.folderChipTextActive,
              ]}>
              {item}
            </Text>
          </Pressable>
        )}
      />
      <Text style={styles.sectionTitle}>Env Files</Text>
      <FlatList
        data={visibleFiles}
        keyExtractor={(item) => item.id}
        onRefresh={() => loadFiles(true)}
        refreshing={refreshing}
        ListEmptyComponent={<Text style={styles.empty}>No env files in this folder yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.fileItem} onPress={() => void openEnv(item)}>
            <Text style={styles.fileName}>{item.envName}</Text>
            <Text style={styles.fileMeta}>{item.directory || '/'}</Text>
            <Text style={styles.fileMeta}>{item.isEncrypted ? 'Encrypted' : 'Plain text'}</Text>
          </Pressable>
        )}
      />

      {activeEnv ? (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>{activeEnv.envName}</Text>
                <Text style={styles.modalMeta}>{activeEnv.directory || '/'}</Text>
              </View>
              <Pressable onPress={() => setActiveEnvId(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            {decryptingId === activeEnv.id ? (
              <View style={styles.decryptingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Decrypting env file...</Text>
              </View>
            ) : (
              <View style={styles.contentWrap}>
                <Text style={styles.contentText}>
                  {decryptedContents[activeEnv.id] || (!activeEnv.isEncrypted ? activeEnv.content : '')}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => void copyActiveEnv()}
              style={styles.copyButton}
              disabled={decryptingId === activeEnv.id}>
              <Text style={styles.copyButtonText}>{copied ? 'Copied' : 'Copy plaintext'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
    header: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 10,
      color: colors.foreground,
    },
    sectionTitle: {
      color: colors.foreground,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 4,
    },
    folderList: {
      gap: 8,
      paddingBottom: 8,
      marginBottom: 10,
    },
    folderChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    folderChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    folderChipText: {
      color: colors.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    folderChipTextActive: {
      color: colors.primaryForeground,
    },
    fileItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      gap: 3,
      backgroundColor: colors.card,
    },
    fileName: {
      fontWeight: '700',
      color: colors.foreground,
    },
    fileMeta: {
      color: colors.mutedForeground,
    },
    error: {
      color: colors.destructive,
      marginBottom: 10,
    },
    refreshButton: {
      marginBottom: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    refreshButtonText: {
      color: colors.foreground,
      fontWeight: '600',
    },
    empty: {
      marginTop: 20,
      textAlign: 'center',
      color: colors.mutedForeground,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 14,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      maxHeight: '80%',
      gap: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    modalTitleWrap: {
      flex: 1,
      gap: 2,
    },
    modalTitle: {
      color: colors.foreground,
      fontWeight: '800',
      fontSize: 14,
    },
    modalMeta: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
    closeButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    closeButtonText: {
      color: colors.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    decryptingWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 20,
    },
    contentWrap: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      maxHeight: 320,
      padding: 10,
    },
    contentText: {
      color: colors.foreground,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 18,
    },
    copyButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      alignItems: 'center',
      paddingVertical: 10,
    },
    copyButtonText: {
      color: colors.primaryForeground,
      fontWeight: '700',
    },
  });
