// Simple encryption/decryption utility (base64 encoding)
// This runs in Node.js so we use Buffer instead of btoa/atob

export const encryptEnv = (content) => {
  return Buffer.from(content, 'utf8').toString('base64');
};

export const decryptEnv = (encrypted) => {
  return Buffer.from(encrypted, 'base64').toString('utf8');
};
