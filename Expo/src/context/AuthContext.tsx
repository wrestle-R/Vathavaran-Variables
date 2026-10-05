import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ApiRequestError,
  extractAuthFromUrl,
  getCurrentUser,
  getGitHubCliAuthUrl,
  normalizeAuthToken,
} from '@/lib/api';
import { clearSession, getToken, getUser, setToken, setUser } from '@/lib/storage';
import type { GitHubUser } from '@/types';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: GitHubUser | null;
  token: string | null;
  bootstrapping: boolean;
  authError: string | null;
  signInWithToken: (incomingToken: string) => Promise<void>;
  startOAuthInBrowser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<GitHubUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await getToken();
        const savedUser = await getUser();

        if (!savedToken) {
          return;
        }

        const freshUser = await getCurrentUser(savedToken);
        setTokenState(savedToken);
        setUserState(freshUser);

        if (!savedUser) {
          await setUser(JSON.stringify(freshUser));
        }
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          await clearSession();
        } else {
          const savedToken = await getToken();
          const savedUser = await getUser();
          if (savedToken && savedUser) {
            try {
              setUserState(JSON.parse(savedUser));
              setTokenState(savedToken);
            } catch {
              await clearSession();
            }
          }
          setAuthError('Could not verify your session. Check your connection and retry.');
        }
      } finally {
        setBootstrapping(false);
      }
    };

    restoreSession();
  }, []);

  const persistSession = useCallback(async (nextToken: string, nextUser: GitHubUser) => {
    await Promise.all([setToken(nextToken), setUser(JSON.stringify(nextUser))]);
    setTokenState(nextToken);
    setUserState(nextUser);
  }, []);

  const signInWithToken = useCallback(
    async (incomingToken: string) => {
      setAuthError(null);
      const normalizedToken = normalizeAuthToken(incomingToken);
      const nextUser = await getCurrentUser(normalizedToken);
      await persistSession(normalizedToken, nextUser);
    },
    [persistSession]
  );

  const startOAuthInBrowser = useCallback(async () => {
    setAuthError(null);
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'vathavaran',
        path: 'auth/callback',
      });

      const authUrl = getGitHubCliAuthUrl(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        setAuthError('OAuth was cancelled before completion.');
        return;
      }

      const { token: incomingToken } = extractAuthFromUrl(result.url);

      if (!incomingToken) {
        setAuthError('Sign-in did not return a session. Please try again.');
        return;
      }

      await signInWithToken(incomingToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to open OAuth flow.');
    }
  }, [signInWithToken]);

  const signOut = useCallback(async () => {
    await clearSession();
    setTokenState(null);
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      bootstrapping,
      authError,
      signInWithToken,
      startOAuthInBrowser,
      signOut,
    }),
    [authError, bootstrapping, signInWithToken, signOut, startOAuthInBrowser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
