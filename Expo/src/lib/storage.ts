import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';
export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}
export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);
  const secure = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secure) return secure;
  const legacy = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
  return legacy;
}
export async function deleteToken(): Promise<void> {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}
export async function setUser(userJson: string): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, userJson);
}
export async function getUser(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}
export async function clearSession(): Promise<void> {
  await deleteToken();
  await AsyncStorage.removeItem(USER_KEY);
}
