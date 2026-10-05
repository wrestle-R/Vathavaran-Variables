import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { GitHubUser, Repository } from './contracts';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new ApiError(503, `Server configuration missing: ${name}`);
  return value;
}
export function database() {
  const app = getApps()[0] ?? initializeApp({ credential: cert({
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }) });
  return getFirestore(app);
}
function sessionKey() {
  const secret = required('SESSION_SECRET');
  if (secret.length < 32) throw new ApiError(503, 'SESSION_SECRET must contain at least 32 characters');
  return createHash('sha256').update(secret).digest();
}
export function seal(value: object): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', sessionKey(), iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), payload]).toString('base64url');
}
export function unseal<T>(value: string): T | null {
  try {
    const buffer = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', sessionKey(), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString()) as T;
  } catch { return null; }
}
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
export function tokenFrom(request: NextRequest): string {
  const bearer = request.headers.get('authorization');
  if (bearer) {
    if (!/^Bearer \S+$/i.test(bearer)) throw new ApiError(401, 'Invalid bearer token');
    return bearer.slice(7);
  }
  const session = unseal<{ token: string; expires: number }>(request.cookies.get('varte_session')?.value ?? '');
  if (!session || session.expires < Date.now()) throw new ApiError(401, 'Sign in to continue');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin !== new URL(required('APP_URL')).origin) throw new ApiError(403, 'Request origin is not allowed');
  }
  return session.token;
}
export async function github<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: {
    Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
  }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    if (response.status === 401) throw new ApiError(401, 'GitHub session expired. Sign in again');
    if (response.status === 404) throw new ApiError(404, 'Repository unavailable or access denied');
    if (response.status === 403 || response.status === 429) throw new ApiError(429, 'GitHub rate limit or access restriction. Try again later');
    throw new ApiError(502, 'GitHub is unavailable. Try again');
  }
  return response.json() as Promise<T>;
}
export async function authenticate(request: NextRequest) {
  const token = tokenFrom(request);
  const user = await github<GitHubUser>('/user', token);
  return { token, user };
}
export async function repositoryAccess(repo: string, token: string, write = false) {
  const value = await github<Repository>(`/repos/${repo}`, token);
  if (write && !value.permissions?.push && !value.permissions?.admin) throw new ApiError(403, 'Repository write access is required');
  // Environment files are private even when their associated repository is public.
  if (!write && !value.permissions?.pull && !value.permissions?.push && !value.permissions?.admin) throw new ApiError(403, 'Repository access is required');
  return value;
}
export async function repositories(token: string) {
  const output: Repository[] = [];
  for (let page = 1; page <= 100; page++) {
    const batch = await github<Repository[]>(`/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated&page=${page}`, token);
    output.push(...batch);
    if (batch.length < 100) return output;
  }
  throw new ApiError(422, 'Too many repositories. Filter by a specific repository');
}
export async function body(request: NextRequest): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 800000) throw new ApiError(413, 'Request exceeds the environment file size limit');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ApiError(400, 'Send a valid JSON object'); }
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function failure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error('API operation failed', error instanceof Error ? error.name : 'UnknownError');
  return json({ error: 'The operation could not complete. Please try again' }, 500);
}
