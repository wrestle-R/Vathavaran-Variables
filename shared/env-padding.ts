// CryptoJS's default unpad trusts only the final byte. Check the full
// PKCS#7 suffix so damaged files do not look like empty environments.
export function unpadEnvBytes(data: { words: number[]; sigBytes: number }) {
  const length = data.sigBytes;
  const invalid = new Error('Could not decrypt this saved file');
  if (length < 16 || length % 16 !== 0) throw invalid;
  const byteAt = (index: number) => (data.words[index >>> 2] >>> (24 - (index % 4) * 8)) & 255;
  const padding = byteAt(length - 1);
  if (padding < 1 || padding > 16) throw invalid;
  for (let index = length - padding; index < length; index++) {
    if (byteAt(index) !== padding) throw invalid;
  }
  data.sigBytes -= padding;
}
