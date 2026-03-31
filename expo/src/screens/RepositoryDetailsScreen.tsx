import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { getEnvFiles } from '@/lib/api';
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
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors);

  useEffect(() => {
    const loadFiles = async () => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getEnvFiles(token, route.params.repoFullName);
        setFiles(data.envFiles);
      } catch (incomingError) {
        setError(
          incomingError instanceof Error ? incomingError.message : 'Failed to load env files.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [route.params.repoFullName, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{route.params.repoFullName}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No env files stored yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.fileItem}>
            <Text style={styles.fileName}>{item.envName}</Text>
            <Text style={styles.fileMeta}>{item.directory || '/'}</Text>
            <Text style={styles.fileMeta}>{item.isEncrypted ? 'Encrypted' : 'Plain text'}</Text>
          </View>
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
    },
    header: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 12,
      color: colors.foreground,
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
    empty: {
      marginTop: 20,
      textAlign: 'center',
      color: colors.mutedForeground,
    },
  });
