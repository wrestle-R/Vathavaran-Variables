import { REQUEST_TIMEOUT_MS, WORKER_AUTH_CALLBACK_URL, WORKER_BASE_URL } from '@/config/env';
import type { EnvFile, GitHubRepository, GitHubUser } from '@/types';

type RequestOptions = RequestInit & {
  token?: string;
  timeoutMs?: number;
};

export function normalizeAuthToken(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const normalizedToken = options.token ? normalizeAuthToken(options.token) : undefined;

    const response = await fetch(`${WORKER_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {}),
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.message === 'string' && data.message) ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGitHubAuthUrl(): Promise<string> {
  const data = await request<{ url: string }>('/api/auth/github');
  return data.url;
}

export function getGitHubCliAuthUrl(redirectUri: string): string {
  return `${WORKER_BASE_URL}/api/auth/github/cli?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function getOAuthCallbackUrl(): string {
  return WORKER_AUTH_CALLBACK_URL;
}

export function extractAuthFromUrl(url: string): { token?: string; user?: GitHubUser } {
  const parsed = new URL(url);
  const tokenParam = parsed.searchParams.get('token');
  const token = tokenParam ? normalizeAuthToken(tokenParam) : undefined;
  const userParam = parsed.searchParams.get('user');

  if (!userParam) {
    return { token };
  }

  try {
    const user = JSON.parse(decodeURIComponent(userParam)) as GitHubUser;
    return { token, user };
  } catch {
    return { token };
  }
}

export function getCurrentUser(token: string): Promise<GitHubUser> {
  return request<GitHubUser>('/api/user', { method: 'GET', token });
}

export function getRepositories(token: string): Promise<GitHubRepository[]> {
  return request<GitHubRepository[]>('/api/repositories', { method: 'GET', token });
}

export function getEnvFiles(
  token: string,
  repoFullName: string,
  directory = ''
): Promise<{ success: boolean; envFiles: EnvFile[] }> {
  return request<{ success: boolean; envFiles: EnvFile[] }>('/api/env/pull', {
    method: 'POST',
    token,
    body: JSON.stringify({ repoFullName, directory }),
  });
}

export function getEnvList(token: string): Promise<{ success: boolean; envFiles: EnvFile[] }> {
  return request<{ success: boolean; envFiles: EnvFile[] }>('/api/env/list', {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}
