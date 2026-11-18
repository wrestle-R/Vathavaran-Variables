import { unpadEnvBytes } from "../../shared/env-padding";
import type { EnvFile } from "./contracts";
export class ClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, data?: object, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(path, {
      method: data ? "POST" : "GET",
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => {
      throw new ClientError(
        502,
        "The server returned an unexpected response. Please retry",
      );
    });
    if (!response.ok)
      throw new ClientError(response.status, result.error || "Request failed");
    return result;
  } catch (error) {
    if (error instanceof ClientError) throw error;
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new ClientError(
        504,
        "The server took too long to respond. Please retry",
      );
    throw new ClientError(
      502,
      "Could not reach the server. Check your connection and retry",
    );
  }
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
export async function decrypt(
  file: EnvFile,
  loadKey = () => api<{ encryptionKey: string }>("/api/encryption-key"),
): Promise<string> {
  if (!file.isEncrypted) return file.content;
  const [{ encryptionKey }, { default: CryptoJS }] = await Promise.all([
    loadKey(),
    import("crypto-js"),
  ]);
  const parsed = CryptoJS.format.OpenSSL.parse(file.content);
  if (!encryptionKey || parsed.salt?.sigBytes !== 8)
    throw new Error("Could not decrypt this file");
  const bytes = CryptoJS.AES.decrypt(parsed, encryptionKey, { padding: CryptoJS.pad.NoPadding });
  unpadEnvBytes(bytes);
  return bytes.toString(CryptoJS.enc.Utf8);
}
