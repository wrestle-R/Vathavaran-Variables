import CryptoJS from 'crypto-js';

import { WORKER_BASE_URL } from '@/config/env';

let cachedEncryptionKey: string | null = null;

async function getEncryptionKey(): Promise<string> {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const response = await fetch(`${WORKER_BASE_URL}/api/encryption-key`);
  const data = (await response.json().catch(() => ({}))) as { encryptionKey?: string; error?: string };

  if (!response.ok || !data.encryptionKey) {
    throw new Error(data.error || 'Failed to fetch encryption key');
  }

  cachedEncryptionKey = data.encryptionKey;
  return cachedEncryptionKey;
}

export async function decryptEnvContent(content: string, isEncrypted: boolean): Promise<string> {
  if (!isEncrypted) {
    return content;
  }

  const encryptionKey = await getEncryptionKey();
  const decrypted = CryptoJS.AES.decrypt(content, encryptionKey).toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new Error('Failed to decrypt env content');
  }

  return decrypted;
}
