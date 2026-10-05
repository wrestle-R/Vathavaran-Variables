export type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  bio?: string;
  html_url: string;
};
export type Repository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
  language: string | null;
  html_url: string;
  permissions?: { push?: boolean; pull?: boolean; admin?: boolean };
};
export type EnvFile = {
  id: string;
  userId: number;
  userName: string;
  repoFullName: string;
  repoName: string;
  directory: string;
  envName: string;
  content: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
};
export function validRepository(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(value) &&
    value.length <= 240
  );
}
export function validCallback(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      ((url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
        url.pathname === "/callback") ||
        (url.protocol === "vathavaran:" &&
          url.hostname === "auth" &&
          url.pathname === "/callback"))
    );
  } catch {
    return false;
  }
}
