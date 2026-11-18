"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { searchVariables, type MetadataPage, type SearchMatch, type SearchResult } from "../../shared/env-search";
import { api, ClientError, date, decrypt, safeFilename } from "@/lib/client";
import type { EnvFile, Repository } from "@/lib/contracts";
import { CopyButton } from "./copy";

export function VariableSearch({ repository, repositories }: { repository?: string; repositories?: Repository[] }) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SearchMatch | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const scan = useRef<AbortController | null>(null);
  const viewer = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => () => {
    scan.current?.abort();
    viewer.current?.abort();
  }, []);

  function clearViewer() {
    viewer.current?.abort();
    setSelected(null);
    setPlaintext(null);
    setOpening(false);
  }

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const directory = String(fields.get("directory") ?? "");
    const options = {
      query: String(fields.get("query") ?? "").trim(),
      repoFullName: repository || String(fields.get("repository") ?? "") || undefined,
      directory: fields.has("root") ? "" : directory || undefined,
      envName: String(fields.get("filename") ?? "") || undefined,
      exact: fields.has("exact"),
      history: fields.has("history"),
    };
    scan.current?.abort();
    const controller = new AbortController();
    scan.current = controller;
    setError("");
    setResult(null);
    setProgress("Finding saved files…");
    let expired = false;
    let key: Promise<{ encryptionKey: string }> | undefined;
    async function request<T>(path: string, data?: object) {
      try {
        return await api<T>(path, data, controller.signal);
      } catch (error) {
        if (error instanceof ClientError && error.status === 401) {
          expired = true;
          controller.abort();
        }
        throw error;
      }
    }
    try {
      const search = await searchVariables({ ...options, repoFullName: undefined }, {
        signal: controller.signal,
        page: cursor => request<MetadataPage>("/api/env/discover", {
          repoFullName: options.repoFullName, directory: options.directory, envName: options.envName, cursor,
        }),
        plaintext: async ({ id }) => {
          const { file } = await request<{ file: EnvFile }>("/api/env/record", { id });
          return decrypt(file, () => key ??= request("/api/encryption-key"));
        },
        progress: (stage, done, total) => {
          if (stage === "scanning") setProgress(`Scanned ${done} of ${total} files…`);
        },
      });
      if (scan.current !== controller) return;
      if (expired) setError("Your session expired. Sign in again to search.");
      else setResult(search);
    } catch {
      if (scan.current === controller) setError("Enter 1–128 letters, numbers, or underscores.");
    } finally {
      if (scan.current === controller) setProgress("");
    }
  }

  async function reveal() {
    if (!selected) return;
    const controller = new AbortController();
    viewer.current = controller;
    setOpening(true);
    setError("");
    try {
      const { file } = await api<{ file: EnvFile }>("/api/env/record", { id: selected.id }, controller.signal);
      const text = await decrypt(file, () => api("/api/encryption-key", undefined, controller.signal));
      if (!controller.signal.aborted) setPlaintext(text);
    } catch {
      if (!controller.signal.aborted) setError("Could not open this saved version. Check your access and try again.");
    } finally {
      if (!controller.signal.aborted) setOpening(false);
    }
  }

  function download() {
    if (!selected || plaintext === null) return;
    const url = URL.createObjectURL(new Blob([plaintext], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename(selected.envName);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const groups = new Map<string, SearchMatch[]>();
  for (const match of result?.matches ?? []) {
    const group = JSON.stringify([match.repoFullName, match.directory, match.envName]);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(match);
  }

  return (
    <section className="variable-search" aria-label="Variable search">
      <details onToggle={event => { if (!event.currentTarget.open) scan.current?.abort(); }}>
        <summary><Search size={16} /> Search variables</summary>
        <form onSubmit={run}>
          <div className="variable-search-fields">
            <label>Variable name<input name="query" required maxLength={128} pattern="[A-Za-z0-9_]+" placeholder="GROK" /></label>
            {repositories && <label>Repository<select name="repository">
              <option value="">All accessible repositories</option>
              {repositories.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
            </select></label>}
            <label>Directory<input name="directory" maxLength={1000} placeholder="Any directory" /></label>
            <label>Filename<input name="filename" maxLength={240} placeholder="Any filename" /></label>
          </div>
          <div className="actions variable-search-options">
            <label><input type="checkbox" name="root" /> Root only</label>
            <label><input type="checkbox" name="exact" /> Exact name</label>
            <label><input type="checkbox" name="history" /> Include history</label>
          </div>
          <div className="actions">
            <button className="button" type="submit">Search</button>
            {progress && <button className="button secondary" type="button" onClick={() => scan.current?.abort()}>Cancel</button>}
          </div>
        </form>
        <p role="status">{progress ? progress.startsWith("Scanned") ? "Scanning saved files…" : progress : result && (
          result.status === "cancelled" ? "Search cancelled." :
          result.status === "partial" ? "Search incomplete. Try narrowing the scope or searching again." :
          result.matches.length ? `${result.matches.length} matching saved versions.` : "No matching variable names."
        )}</p>
        {progress.startsWith("Scanned") && <p>{progress}</p>}
        {error && !selected && <p role="alert">{error}</p>}
        {result?.status === "partial" && <p>Checked {result.scanned} of {result.eligible} files. {result.errors.filter(item => item.code === "file_unreadable").length} unreadable.</p>}
        {[...groups.entries()].map(([group, matches]) => {
          const { repoFullName, directory, envName } = matches[0];
          return <div className="variable-search-group" key={group}>
            <h3>{repoFullName} / {directory || "Root"} / {envName}</h3>
            {matches.map(match => <div className="variable-search-match" key={match.id}>
              <div><code>{match.names.join(", ")}</code><p>{match.historical ? "Historical" : "Latest"} · {date(match.updatedAt)}</p></div>
              <button type="button" className="button secondary" onClick={() => {
                setError("");
                setSelected(match);
                dialog.current?.showModal();
              }}>View version</button>
            </div>)}
          </div>;
        })}
      </details>
      <dialog ref={dialog} className="detail-panel variable-search-dialog" onClose={clearViewer} aria-label="Saved file version">
        {selected && <>
          <header><div><h2>{selected.envName}</h2><p>{selected.repoFullName} · {selected.directory || "Root"} · {date(selected.updatedAt)}</p></div>
            <button className="quiet" onClick={() => dialog.current?.close()}>Close</button>
          </header>
          {error && <p role="alert">{error}</p>}
          {plaintext === null ? <button className="button secondary" disabled={opening} onClick={reveal}>{opening ? "Opening…" : "Reveal contents"}</button> :
            <><pre>{plaintext}</pre><div className="actions"><CopyButton value={plaintext} label="Copy file contents" /><button className="button secondary" onClick={download}>Download</button></div></>}
        </>}
      </dialog>
    </section>
  );
}
