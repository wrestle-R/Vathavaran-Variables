import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

async function setTokenFallback(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function getTokenFallback(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function deleteTokenFallback(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await setTokenFallback(token);
    return;
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    await setTokenFallback(token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getTokenFallback();
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return getTokenFallback();
  }
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await deleteTokenFallback();
    return;
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    await deleteTokenFallback();
  }
}

export async function setUser(userJson: string): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, userJson);
}

export async function getUser(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}

export async function deleteUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.allSettled([deleteToken(), deleteUser()]);
}
