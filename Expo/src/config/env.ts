export const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://vathavaran-variable.vercel.app';

export const AUTH_CALLBACK_URL =
  process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL ?? `${API_BASE_URL}/api/auth/github/callback`;

export const REQUEST_TIMEOUT_MS = 20_000;
