/** Shared by web and Expo. Never return file bodies from the scanner. */
export type FileMetadata = {
  id: string;
  repoFullName: string;
  directory: string;
  envName: string;
  updatedAt: string;
  createdAt: string;
  isEncrypted: boolean;
};
export type SearchOptions = { query: string; exact?: boolean; history?: boolean; repoFullName?: string; directory?: string; envName?: string };
export type SearchMatch = FileMetadata & { names: string[]; historical: boolean };
export type SearchResult = {
  schemaVersion: 1;
  status: 'complete' | 'partial' | 'cancelled';
  scanned: number;
  eligible: number;
  matches: SearchMatch[];
  errors: { id?: string; code: 'discovery_failed' | 'file_unreadable' | 'limit_exceeded' }[];
};
export type MetadataPage = { files: FileMetadata[]; nextCursor: string | null };

// Values are never expanded or executed. An unterminated quote invalidates the
// file rather than allowing assignments inside its value to become matches.
export function variableNames(text: string): string[] {
  const names = new Set<string>();
  let quote = '';
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    let value = line;
    if (!quote) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      names.add(match[1]);
      value = match[2];
      if (!value.startsWith('"') && !value.startsWith("'") && !value.startsWith('`')) continue;
      quote = value[0];
      value = value.slice(1);
    }
    let escaped = false;
    for (const char of value) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\' && quote !== "'") { escaped = true; continue; }
      if (char === quote) { quote = ''; break; }
    }
  }
  if (quote) throw new Error('Malformed quoted value');
  return [...names].sort();
}
export function eligibleFiles(files: FileMetadata[], options: SearchOptions): SearchMatch[] {
  const ordered = [...files].sort((a, b) => {
    const stamp = (f: FileMetadata) => Date.parse(f.updatedAt || f.createdAt) || 0;
    return stamp(b) - stamp(a) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
  });
  const seen = new Set<string>();
  const output: SearchMatch[] = [];
  for (const file of ordered) {
    const identity = JSON.stringify([file.repoFullName, file.directory, file.envName]);
    const historical = seen.has(identity);
    seen.add(identity);
    if (historical && !options.history) continue;
    if (options.repoFullName !== undefined && file.repoFullName !== options.repoFullName) continue;
    if (options.directory !== undefined && file.directory !== options.directory) continue;
    if (options.envName !== undefined && file.envName !== options.envName) continue;
    output.push({ ...file, names: [], historical });
  }
  return output;
}
export async function searchVariables(
  options: SearchOptions,
  io: {
    page: (cursor?: string) => Promise<MetadataPage>;
    plaintext: (file: FileMetadata) => Promise<string>;
    signal: AbortSignal;
    progress?: (stage: 'discovering' | 'scanning', done: number, total: number) => void;
  },
): Promise<SearchResult> {
  if (!/^[A-Za-z0-9_]{1,128}$/.test(options.query)) throw new Error('Use 1–128 letters, numbers, or underscores');
  const result: SearchResult = { schemaVersion: 1, status: 'complete', scanned: 0, eligible: 0, matches: [], errors: [] };
  const files: FileMetadata[] = [];
  let cursor: string | undefined;
  const cursors = new Set<string>();
  try {
    do {
      if (io.signal.aborted) throw new Error("Search cancelled");
      const page = await io.page(cursor);
      if (io.signal.aborted) throw new Error("Search cancelled");
      files.push(...page.files);
      io.progress?.('discovering', files.length, 0);
      if (files.length > 50000) {
        result.status = 'partial'; result.errors.push({ code: 'limit_exceeded' }); return result;
      }
      cursor = page.nextCursor ?? undefined;
      if (cursor && cursors.has(cursor)) throw new Error('Repeated cursor');
      if (cursor) cursors.add(cursor);
    } while (cursor);
  } catch {
    result.status = io.signal.aborted ? 'cancelled' : 'partial';
    if (!io.signal.aborted) result.errors.push({ code: 'discovery_failed' });
    return result; // Cannot choose latest versions from incomplete discovery.
  }
  const eligible = eligibleFiles(files, options);
  result.eligible = eligible.length;
  const query = options.query.toLowerCase();
  // Serial scanning bounds memory, bandwidth and in-flight decryptions.
  for (const file of eligible) {
    if (io.signal.aborted) { result.status = 'cancelled'; break; }
    try {
      const names = variableNames(await io.plaintext(file));
      if (io.signal.aborted) throw new Error("Search cancelled");
      const matches = names.filter(name => options.exact ? name.toLowerCase() === query : name.toLowerCase().includes(query));
      if (matches.length) result.matches.push({ ...file, names: matches });
    } catch {
      if (io.signal.aborted) { result.status = 'cancelled'; break; }
      result.status = 'partial'; result.errors.push({ id: file.id, code: 'file_unreadable' });
    }
    result.scanned++;
    io.progress?.('scanning', result.scanned, result.eligible);
  }
  return result;
}
