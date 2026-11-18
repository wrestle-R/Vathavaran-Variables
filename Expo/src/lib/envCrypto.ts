import CryptoJS from 'crypto-js';

import { getEncryptionKey } from '@/lib/api';
import { unpadEnvBytes } from '../../../shared/env-padding';

export async function decryptEnvContent(
  content: string,
  isEncrypted: boolean,
  token: string,
  loadKey = () => getEncryptionKey(token)
): Promise<string> {
  if (!isEncrypted) {
    return content;
  }

  const encryptionKey = await loadKey();
  const parsed = CryptoJS.format.OpenSSL.parse(content);
  if (!encryptionKey || parsed.salt?.sigBytes !== 8) throw new Error('Could not decrypt this file');
  const bytes = CryptoJS.AES.decrypt(parsed, encryptionKey, { padding: CryptoJS.pad.NoPadding });
  unpadEnvBytes(bytes);
  return bytes.toString(CryptoJS.enc.Utf8);
}
