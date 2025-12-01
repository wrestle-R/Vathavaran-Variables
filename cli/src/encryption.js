// Proper encryption using CryptoJS AES for Node.js
import CryptoJS from 'crypto-js';

// Cache for encryption key
let cachedEncryptionKey = null;

// Fetch encryption key from serverless API
async function getEncryptionKey() {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  try {
    const response = await fetch('https://my-worker.vidyoyo.workers.dev/api/encryption-key');
    const data = await response.json();
    cachedEncryptionKey = data.encryptionKey;
    return cachedEncryptionKey;
  } catch (error) {
    console.error('Failed to fetch encryption key from API:', error);
    throw new Error('Unable to retrieve encryption key. Please ensure the serverless worker is deployed.');
  }
}

export const encryptEnv = async (content) => {
  try {
    const key = await getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(content, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt environment variables');
  }
};

export const decryptEnv = async (encrypted) => {
  try {
    const key = await getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    const originalText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!originalText) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return originalText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt environment variables');
  }
};
