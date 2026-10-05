"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  FileKey2,
  Folder,
  Github,
  GitBranch,
  Search,
  RefreshCw,
} from "lucide-react";
import { api, ClientError } from "@/lib/client";
import type { EnvFile, GitHubUser, Repository } from "@/lib/contracts";
export function Workspace() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [files, setFiles] = useState<EnvFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentUser = await api<GitHubUser>("/api/user");
      setUser(currentUser);
      setSignedOut(false);
      const [repositories, envs] = await Promise.all([
        api<Repository[]>("/api/repositories"),
        api<{ envFiles: EnvFile[] }>("/api/env/list", {}),
      ]);
      setRepos(repositories);
      setFiles(envs.envFiles);
    } catch (e) {
      if (e instanceof ClientError && e.status === 401) setSignedOut(true);
      else
        setError(e instanceof Error ? e.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, []);
  // Initial network fetch; state is the response, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void load();
  }, [load]);
  const counts = useMemo(
    () =>
      files.reduce<Record<string, number>>((result, file) => {
        result[file.repoFullName] = (result[file.repoFullName] || 0) + 1;
        return result;
      }, {}),
    [files],
  );
  const visible = repos.filter(
    (repo) =>
      repo.full_name.toLowerCase().includes(query.toLowerCase()) &&
      (filter !== "files" || counts[repo.full_name]) &&
      (filter !== "private" || repo.private),
  );
  if (signedOut)
    return (
      <div className="page wrap">
        <div className="empty-state">
          <Github size={34} />
          <h2>Your workspace is one sign-in away.</h2>
          <p>
            Connect GitHub to see your repositories and encrypted environment
            files.
          </p>
          <Link className="button" href="/auth">
            Connect GitHub <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  return (
    <div className="page wrap">
      <div className="eyebrow">
        <span className="live-dot" /> Your workspace
      </div>
      <div className="page-title">
        <div>
          <h1>
            {user
              ? `Welcome back, ${user.name?.split(" ")[0] || user.login}.`
              : "Your environment, organized."}
          </h1>
          <p>Everything your team needs to get from clone to running.</p>
        </div>
        <div className="profile-menu">
          <button
            className="quiet"
            onClick={load}
            disabled={loading}
            aria-label="Refresh workspace"
          >
            <RefreshCw size={17} />
          </button>
          {user && (
            <button
              className="quiet"
              onClick={async () => {
                try {
                  await api("/api/auth/logout", {});
                  setUser(null);
                  setFiles([]);
                  setRepos([]);
                  setSignedOut(true);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Sign out failed");
                }
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="error-message" role="alert">
          {error}{" "}
          <button className="quiet" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="loading-grid" aria-label="Loading workspace">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">
                <Folder size={14} /> Repositories
              </div>
              <strong>{repos.length}</strong>
            </div>
            <div className="stat">
              <div className="stat-label">
                <FileKey2 size={14} /> Environment files
              </div>
              <strong>{files.length}</strong>
            </div>
            <div className="stat">
              <div className="stat-label">
                <GitBranch size={14} /> With environment files
              </div>
              <strong>{Object.keys(counts).length}</strong>
            </div>
          </div>
          <div className="section-label">
            <h2>Repositories</h2>
            <span>{visible.length} available</span>
          </div>
          <div className="toolbar">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Search repositories"
                placeholder="Find a repository…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              aria-label="Filter repositories"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All repositories</option>
              <option value="files">With env files</option>
              <option value="private">Private repositories</option>
            </select>
            <Link href="/docs#push" className="text-link">
              Push from the CLI <ArrowRight size={14} />
            </Link>
          </div>
          <div className="repo-grid">
            {visible.map((repo) => (
              <Link
                href={`/repo/${repo.full_name}`}
                className="repo-card"
                key={repo.id}
              >
                <div className="repo-card-top">
                  <Folder size={21} />
                  <span className="tag">
                    {repo.private ? "Private" : "Public"}
                  </span>
                </div>
                <span className="repo-owner">
                  {repo.full_name.split("/")[0]} /
                </span>
                <h3>{repo.name}</h3>
                <p>
                  {repo.description ||
                    "Your project’s environment files, in one place."}
                </p>
                <div className="repo-card-bottom">
                  <span>{counts[repo.full_name] || 0} env files</span>
                  <span>
                    {repo.language || "Repository"} <ArrowUpRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {!visible.length && (
            <div className="empty-state">
              <Search size={26} />
              <h2>{query ? "No repositories match." : "Nothing here yet."}</h2>
              <p>
                {query
                  ? "Try a different name or filter."
                  : "Connect a repository or push your first environment file from the CLI."}
              </p>
              <Link className="button secondary" href="/docs">
                Read the guide
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
