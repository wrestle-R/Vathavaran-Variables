import type { NextRequest } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import type { EnvFile, Repository } from './contracts';
import { validRepository } from './contracts';
import { ApiError, body, database, json, repositories, repositoryAccess, seal, unseal } from './server';
import type { FileMetadata } from '../../shared/env-search';

type Cursor = { userId: number; scope: string; repo: string; after: string; expires: number; asOf: string; start?: boolean };
const fields = ['repoFullName', 'directory', 'envName', 'updatedAt', 'createdAt', 'isEncrypted'];
const validId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
export async function searchDiscovery(request: NextRequest, token: string, userId: number) {
  const input = await body(request);
  if (input.repoFullName !== undefined && !validRepository(input.repoFullName)) throw new ApiError(400, 'Repository must be owner/name');
  for (const [field, max] of [['directory', 1000], ['envName', 240]] as const) {
    if (input[field] !== undefined && (typeof input[field] !== 'string' || input[field].length > max)) throw new ApiError(400, `Invalid ${field}`);
  }
  const scope = JSON.stringify([input.repoFullName ?? null, input.directory ?? null, input.envName ?? null]);
  let cursor: Cursor | null = null;
  if (input.cursor !== undefined) {
    if (typeof input.cursor !== 'string' || input.cursor.length > 8000) throw new ApiError(400, 'Invalid search cursor');
    cursor = unseal<Cursor>(input.cursor);
    if (!cursor || cursor.userId !== userId || cursor.scope !== scope || cursor.expires < Date.now() || !validRepository(cursor.repo) || !validId(cursor.after) || !Number.isFinite(Date.parse(cursor.asOf))) throw new ApiError(400, 'Search expired or cursor invalid. Start a new search');
  }
  let allowed: Repository[];
  if (validRepository(input.repoFullName)) {
    const repo = await repositoryAccess(input.repoFullName, token);
    allowed = [{ ...repo, storageNames: input.repoFullName === repo.full_name ? [] : [input.repoFullName] }];
    // Include known renamed paths for this canonical repository as well.
    const discovered = await repositories(token, userId, true);
    const known = discovered.find(r => r.full_name === repo.full_name);
    if (known) allowed[0].storageNames = [...new Set([...(allowed[0].storageNames ?? []), ...(known.storageNames ?? [])])];
  } else allowed = await repositories(token, userId, true);
  allowed.sort((a, b) => a.full_name < b.full_name ? -1 : a.full_name > b.full_name ? 1 : 0);
  const repo = allowed.find(r => !cursor || r.full_name >= cursor.repo);
  if (!repo) return json({ files: [], nextCursor: null });
  const after = cursor?.repo === repo.full_name && !cursor.start ? cursor.after : undefined;
  const asOf = cursor?.asOf ?? new Date().toISOString();
  const names = [...new Set([repo.full_name, ...(repo.storageNames ?? [])])];
  // A single in-query supports up to 30 names. Never silently omit aliases.
  if (names.length > 30) throw new ApiError(422, 'Too many renamed paths for this repository');
  let query = database().collection('envFiles').where('repoFullName', 'in', names).select(...fields).orderBy(FieldPath.documentId()).limit(101);
  if (after) query = query.startAfter(after);
  const snapshot = await query.get();
  const page = snapshot.docs.slice(0, 100);
  const files: FileMetadata[] = [];
  for (const doc of page) {
    const data = doc.data();
    if (Date.parse(data.createdAt) > Date.parse(asOf)) continue;
    const file: FileMetadata = {
      id: doc.id, repoFullName: repo.full_name, directory: data.directory ?? '', envName: data.envName,
      updatedAt: data.updatedAt ?? data.createdAt ?? '', createdAt: data.createdAt ?? '', isEncrypted: data.isEncrypted === true,
    };
    if (input.directory !== undefined && file.directory !== input.directory) continue;
    if (input.envName !== undefined && file.envName !== input.envName) continue;
    files.push(file);
  }
  const nextRepo = allowed.find(r => r.full_name > repo.full_name);
  const more = snapshot.docs.length > 100;
  // A start cursor begins the next repository without skipping its first ID.
  const last = page.at(-1)?.id ?? after ?? '_';
  const nextCursor = more || nextRepo ? seal({ userId, scope, repo: more ? repo.full_name : nextRepo!.full_name, after: more ? last : '_', expires: cursor?.expires ?? Date.now() + 900000, asOf, start: !more }) : null;
  return json({ files, nextCursor });
}
export async function searchRecord(request: NextRequest, token: string) {
  const input = await body(request);
  if (!validId(input.id)) throw new ApiError(400, 'Invalid saved file ID');
  const snapshot = await database().collection('envFiles').doc(input.id).get();
  if (!snapshot.exists) throw new ApiError(404, 'File unavailable or access denied');
  const file = snapshot.data() as EnvFile;
  if (!validRepository(file.repoFullName)) throw new ApiError(404, 'File unavailable or access denied');
  let repo: Repository;
  try { repo = await repositoryAccess(file.repoFullName, token); }
  catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) throw new ApiError(404, 'File unavailable or access denied');
    throw error;
  }
  return json({ file: { ...file, id: snapshot.id, repoFullName: repo.full_name } });
}
