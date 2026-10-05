import CryptoJS from 'crypto-js';

import { API_BASE_URL } from '@/config/env';

async function getEncryptionKey(token: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/encryption-key`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  const data = (await response.json().catch(() => ({}))) as {
    encryptionKey?: string;
    error?: string;
  };

  if (!response.ok || !data.encryptionKey) {
    throw new Error(data.error || 'Failed to fetch encryption key');
  }

  return data.encryptionKey;
}

export async function decryptEnvContent(
  content: string,
  isEncrypted: boolean,
  token: string
): Promise<string> {
  if (!isEncrypted) {
    return content;
  }

  const encryptionKey = await getEncryptionKey(token);
  const decrypted = CryptoJS.AES.decrypt(content, encryptionKey).toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new Error('Failed to decrypt env content');
  }

  return decrypted;
}
