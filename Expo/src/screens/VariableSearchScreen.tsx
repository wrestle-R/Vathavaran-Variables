import { useCallback, useRef, useState } from 'react';
import { AppState, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { Button, useStyles } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiRequestError, discoverEnvFiles, getEncryptionKey, getEnvRecord } from '@/lib/api';
import { decryptEnvContent } from '@/lib/envCrypto';
import { type AppColors, useAppTheme } from '@/theme';
import { searchVariables, type SearchMatch, type SearchResult } from '../../../shared/env-search';

export function VariableSearchScreen() {
  const { params } = useRoute();
  const repository = (params as { repoFullName?: string } | undefined)?.repoFullName;
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(createStyles);
  const [query, setQuery] = useState('');
  const [repo, setRepo] = useState('');
  const [directory, setDirectory] = useState('');
  const [filename, setFilename] = useState('');
  const [root, setRoot] = useState(false);
  const [exact, setExact] = useState(false);
  const [history, setHistory] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SearchMatch | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [viewStatus, setViewStatus] = useState('');
  const scan = useRef<AbortController | null>(null);
  const viewer = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    viewer.current?.abort();
    viewer.current = null;
    setPlaintext(null);
    setSelected(null);
    setOpening(false);
    setViewStatus('');
  }, []);

  useFocusEffect(useCallback(() => {
    if (!token) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        scan.current?.abort();
        close();
      }
    });
    return () => {
      subscription.remove();
      scan.current?.abort();
      scan.current = null;
      setProgress('');
      setResult(null);
      setError('');
      close();
    };
  }, [close, token]));

  async function run() {
    if (!token) return;
    const session = token;
    scan.current?.abort();
    const controller = new AbortController();
    scan.current = controller;
    setProgress('Finding saved files…');
    setResult(null);
    setError('');
    let expired = false;
    let key: Promise<string> | undefined;
    const options = {
      query: query.trim(), repoFullName: repository || repo.trim() || undefined,
      directory: root ? '' : directory || undefined, envName: filename || undefined, exact, history,
    };
    if (options.repoFullName && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repoFullName)) {
      setError('Enter the repository as owner/name.');
      setProgress('');
      return;
    }
    async function request<T>(call: () => Promise<T>) {
      try {
        return await call();
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          expired = true;
          controller.abort();
        }
        throw error;
      }
    }
    try {
      const response = await searchVariables({ ...options, repoFullName: undefined }, {
        signal: controller.signal,
        page: cursor => request(() => discoverEnvFiles(session, {
          repoFullName: options.repoFullName, directory: options.directory, envName: options.envName, cursor,
        }, controller.signal)),
        plaintext: async ({ id }) => {
          const { file } = await request(() => getEnvRecord(session, id, controller.signal));
          return decryptEnvContent(file.content, file.isEncrypted, session, () =>
            key ??= request(() => getEncryptionKey(session, controller.signal)));
        },
        progress: (stage, done, total) => {
          if (stage === 'scanning') setProgress(`Scanned ${done} of ${total} files…`);
        },
      });
      if (scan.current !== controller) return;
      if (expired) setError('Your session expired. Sign in again to search.');
      else setResult(response);
    } catch {
      if (scan.current === controller) setError('Enter 1–128 letters, numbers, or underscores.');
    } finally {
      if (scan.current === controller) setProgress('');
    }
  }

  async function reveal() {
    if (!token || !selected) return;
    const controller = new AbortController();
    viewer.current = controller;
    setOpening(true);
    setViewStatus('');
    try {
      const { file } = await getEnvRecord(token, selected.id, controller.signal);
      const value = await decryptEnvContent(file.content, file.isEncrypted, token, () =>
        getEncryptionKey(token, controller.signal));
      if (!controller.signal.aborted) setPlaintext(value);
    } catch {
      if (!controller.signal.aborted) setViewStatus('Could not open this saved version. Check your access and try again.');
    } finally {
      if (!controller.signal.aborted) setOpening(false);
    }
  }

  async function copy() {
    if (plaintext === null) return;
    const controller = viewer.current;
    const copied = await Clipboard.setStringAsync(plaintext).catch(() => false);
    if (viewer.current === controller) setViewStatus(copied ? 'Copied.' : 'Could not copy this file.');
  }

  function field(label: string, value: string, onChangeText: (text: string) => void, maxLength: number, placeholder: string) {
    return <View style={styles.field}>
      <Text style={styles.text}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} maxLength={maxLength}
        placeholder={placeholder} placeholderTextColor={colors.mutedForeground} autoCapitalize="none"
        autoCorrect={false} style={styles.input} />
    </View>;
  }

  function toggle(label: string, value: boolean, onValueChange: (next: boolean) => void) {
    return <View style={styles.toggle}>
      <Text style={[styles.text, { flexShrink: 1 }]}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }} />
    </View>;
  }

  const status = result?.status === 'cancelled' ? 'Search cancelled.'
    : result?.status === 'partial' ? `Search incomplete. Checked ${result.scanned} of ${result.eligible} files. Try narrowing the scope or searching again.`
    : result ? result.matches.length ? `${result.matches.length} matching saved versions.` : 'No matching variable names.' : '';

  return <View style={styles.container}>
    <FlatList
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      data={result?.matches ?? []}
      keyExtractor={item => item.id}
      ListHeaderComponent={<View style={styles.form}>
        {repository && <Text style={styles.text}>{repository}</Text>}
        {field('Variable name', query, setQuery, 128, 'GROK')}
        {!repository && field('Repository', repo, setRepo, 240, 'Any repository or owner/name')}
        {!root && field('Directory', directory, setDirectory, 1000, 'Any directory')}
        {field('Filename', filename, setFilename, 240, 'Any filename')}
        {toggle('Root only', root, setRoot)}
        {toggle('Exact name', exact, setExact)}
        {toggle('Include history', history, setHistory)}
        <Button label="Search" onPress={() => void run()} disabled={!query.trim()} icon="search-outline" />
        {!!progress && <Button label="Cancel" secondary onPress={() => scan.current?.abort()} />}
        {!!progress && <Text style={styles.text}>{progress}</Text>}
        {!!status && <Text accessibilityLiveRegion="polite" style={styles.text}>{status}</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </View>}
      renderItem={({ item }) => <View style={styles.result}>
        <Text style={styles.names}>{item.names.join(', ')}</Text>
        <Text style={styles.text}>{item.repoFullName} / {item.directory || 'Root'} / {item.envName}</Text>
        <Text style={styles.muted}>{item.historical ? 'Historical' : 'Latest'} · {formatDate(item.updatedAt)}</Text>
        <Button label="View version" secondary onPress={() => setSelected(item)} />
      </View>}
    />
    <Modal visible={selected !== null} onRequestClose={close} animationType="none">
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.list}>
          {selected && <>
            <Text accessibilityRole="header" style={styles.names}>{selected.envName}</Text>
            <Text style={styles.text}>{selected.repoFullName} / {selected.directory || 'Root'} · {formatDate(selected.updatedAt)}</Text>
            <Button label="Close" secondary onPress={close} />
            {plaintext === null ? <Button label={opening ? 'Opening…' : 'Reveal contents'} disabled={opening} onPress={() => void reveal()} /> :
              <><Text selectable style={styles.text}>{plaintext}</Text><Button label="Copy file contents" onPress={() => void copy()} /></>}
            {!!viewStatus && <Text accessibilityLiveRegion="polite" style={styles.text}>{viewStatus}</Text>}
          </>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 20, gap: 12 },
    form: { gap: 10 },
    field: { gap: 5 },
    input: { minHeight: 46, borderWidth: 1, borderColor: colors.input, borderRadius: 10, padding: 10, color: colors.foreground, backgroundColor: colors.card },
    text: { color: colors.foreground, fontFamily: 'DMsans_500Medium' },
    muted: { color: colors.mutedForeground, fontFamily: 'DMsans_500Medium' },
    error: { color: colors.destructive },
    toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    result: { gap: 7, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
    names: { color: colors.foreground, fontFamily: 'Manrope_600SemiBold', fontSize: 17 },
  });
}
