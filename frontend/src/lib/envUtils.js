// Proper encryption using CryptoJS AES
import CryptoJS from 'crypto-js';

// Use a consistent encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = 'vathavaran-secret-key-2024'; // Change this to your own secret key

export const encryptEnv = (content) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt environment variables');
  }
};

export const decryptEnv = (encrypted) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
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

// Validate env file format
export const validateEnvFormat = (content) => {
  if (!content || !content.trim()) {
    return {
      isValid: false,
      errors: ['Environment variables cannot be empty']
    };
  }

  const lines = content.split('\n');
  const errors = [];
  const validLines = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      validLines.push(line);
      continue;
    }

    // Check if line contains = sign
    if (!trimmed.includes('=')) {
      errors.push(`Line ${lineNumber}: Invalid format. Expected "KEY=VALUE" but got "${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}"`);
      continue;
    }

    // Extract key and value
    const equalIndex = trimmed.indexOf('=');
    const key = trimmed.substring(0, equalIndex).trim();
    const value = trimmed.substring(equalIndex + 1).trim();

    // Validate key format (should be uppercase with underscores or numbers)
    if (!key) {
      errors.push(`Line ${lineNumber}: Key cannot be empty`);
      continue;
    }

    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      errors.push(`Line ${lineNumber}: Key "${key}" should contain only uppercase letters, numbers, and underscores, and start with a letter or underscore`);
      continue;
    }

    validLines.push(line);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warningCount: Math.max(0, lineNumber - validLines.length - 1) // Count of suspicious lines
  };
};

// Parse env file and format it
export const parseAndFormatEnv = (content) => {
  const lines = content.split('\n');
  const formatted = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      formatted.push(line);
      return;
    }

    // Handle lines with = sign
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      formatted.push(`${key}=${value}`);
    } else {
      formatted.push(line);
    }
  });

  return formatted.join('\n');
};
