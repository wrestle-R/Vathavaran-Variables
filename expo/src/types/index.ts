export type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string;
  html_url?: string;
  email?: string | null;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  updated_at: string;
  stargazers_count: number;
  default_branch?: string;
};

export type EnvFile = {
  id: string;
  userId: string;
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

export type ApiError = {
  status: number;
  message: string;
};
