import type { EnvFile } from "./contracts";
export class ClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, data?: object): Promise<T> {
  const response = await fetch(path, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new ClientError(response.status, result.error || "Request failed");
  return result;
}
export function date(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
export function safeFilename(name: string) {
  return (
    name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+$/, "_") || ".env"
  );
}
export async function decrypt(file: EnvFile): Promise<string> {
  if (!file.isEncrypted) return file.content;
  const [{ encryptionKey }, { default: CryptoJS }] = await Promise.all([
    api<{ encryptionKey: string }>("/api/encryption-key"),
    import("crypto-js"),
  ]);
  const value = CryptoJS.AES.decrypt(file.content, encryptionKey).toString(
    CryptoJS.enc.Utf8,
  );
  if (!value && file.content.length > 44)
    throw new Error("Could not decrypt this file");
  return value;
}
