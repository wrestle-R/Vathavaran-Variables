export const WORKER_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://my-worker.vidyoyo.workers.dev';

export const WORKER_AUTH_CALLBACK_URL =
  process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL ??
  'https://my-worker.vidyoyo.workers.dev/api/auth/github/callback';

export const REQUEST_TIMEOUT_MS = 15000;
