"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileKey2,
  Fingerprint,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { api, ClientError, date, decrypt, safeFilename } from "@/lib/client";
import type { EnvFile } from "@/lib/contracts";
import { CopyButton } from "./copy";
export function RepositoryView({ name }: { name: string }) {
  const [files, setFiles] = useState<EnvFile[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [signedOut, setSignedOut] = useState(false);
  const [directory, setDirectory] = useState("*"),
    [active, setActive] = useState<EnvFile | null>(null),
    [plaintext, setPlaintext] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(false),
    [envName, setEnvName] = useState(".env"),
    [uploadDirectory, setUploadDirectory] = useState(""),
    [content, setContent] = useState(""),
    [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ envFiles: EnvFile[] }>("/api/env/list", {
        repoFullName: name,
      });
      setFiles(result.envFiles);
      setSignedOut(false);
    } catch (e) {
      if (e instanceof ClientError && e.status === 401) setSignedOut(true);
      else
        setError(
          e instanceof Error ? e.message : "Could not load environment files",
        );
    } finally {
      setLoading(false);
    }
  }, [name]);
  // Initial network fetch; state is the response, not derived render state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function reveal(file: EnvFile) {
    setBusy(true);
    setError("");
    setPlaintext(null);
    setActive(file);
    try {
      setPlaintext(await decrypt(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decryption failed");
      setActive(null);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!active || plaintext === null) return;
    const url = URL.createObjectURL(
      new Blob([plaintext], { type: "text/plain" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename(active.envName);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const [{ encryptionKey }, { default: CryptoJS }] = await Promise.all([
        api<{ encryptionKey: string }>("/api/encryption-key"),
        import("crypto-js"),
      ]);
      await api("/api/env/push", {
        repoFullName: name,
        directory: uploadDirectory,
        envName,
        content: CryptoJS.AES.encrypt(content, encryptionKey).toString(),
      });
      setContent("");
      setUpload(false);
      await load();
      setSuccess("Encrypted file uploaded. Existing versions are unchanged.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  const directories = Array.from(
    new Set(files.map((f) => f.directory || "")),
  ).sort();
  const visible = files.filter(
    (f) => directory === "*" || (f.directory || "") === directory,
  );
  if (signedOut)
    return (
      <div className="page wrap">
        <div className="empty-state">
          <h2>Sign in to view this repository.</h2>
          <p>
            Your environment files are available after GitHub verifies
            repository access.
          </p>
          <Link href="/auth" className="button">
            Connect GitHub
          </Link>
        </div>
      </div>
    );
  return (
    <div className="page wrap">
      <div className="breadcrumb">
        <Link href="/dashboard">
          <ArrowLeft size={13} /> Workspace
        </Link>
        <span>/</span>
        <span>{name}</span>
      </div>
      <div className="page-title">
        <div>
          <h1>{name.split("/")[1]}</h1>
          <p>Environment files for {name}. Encrypted and versioned.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setUpload(!upload);
            setSuccess("");
          }}
        >
          <Plus size={16} /> Upload file
        </button>
      </div>
      {error && (
        <div className="error-message" role="alert">
          {error}
          <button className="quiet" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      {upload && (
        <section className="detail-panel">
          <header>
            <h2>Upload an environment file</h2>
            <button
              className="quiet"
              onClick={() => setUpload(false)}
              aria-label="Close upload"
            >
              <X size={18} />
            </button>
          </header>
          <form className="upload-form" onSubmit={save}>
            <label>
              Choose a local file
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 500000) {
                      setError("File exceeds the 500 KB limit");
                      return;
                    }
                    setEnvName(file.name);
                    setContent(await file.text());
                  }
                }}
              />
            </label>
            <label>
              File name
              <input
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                required
                maxLength={240}
              />
            </label>
            <label>
              Directory (leave empty for root)
              <input
                value={uploadDirectory}
                onChange={(e) => setUploadDirectory(e.target.value)}
                placeholder="backend"
                maxLength={1000}
              />
            </label>
            <label>
              File contents
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                spellCheck={false}
                placeholder="DATABASE_URL=…"
              />
            </label>
            <p className="notice">
              Encrypted in your browser before upload. Requires GitHub write
              access.
            </p>
            <div>
              <button className="button" disabled={busy}>
                {busy ? "Encrypting and uploading…" : "Encrypt and upload"}
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="section-label">
        <h2>Environment files</h2>
        <span>{visible.length} files</span>
      </div>
      <div className="toolbar">
        <select
          className="filter-select"
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          aria-label="Filter by directory"
        >
          <option value="*">All directories</option>
          {directories.map((dir) => (
            <option value={dir} key={dir}>
              {dir || "Repository root"}
            </option>
          ))}
        </select>
        <button
          className="quiet"
          onClick={load}
          disabled={loading}
          aria-label="Refresh files"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {loading ? (
        <div className="skeleton" aria-label="Loading environment files" />
      ) : visible.length ? (
        <div className="table-scroll">
          <table className="file-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Directory</th>
                <th>Uploaded by</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-name">
                      <FileKey2 size={19} />
                      {file.envName}
                    </span>
                  </td>
                  <td>{file.directory || "root /"}</td>
                  <td>{file.userName}</td>
                  <td>{date(file.updatedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="button secondary"
                        onClick={() => reveal(file)}
                        disabled={busy}
                      >
                        Open file
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <div className="empty-state">
          <FileKey2 size={32} />
          <h2>A fresh environment.</h2>
          <p>
            Upload your first file here, or use varte push from this repository.
          </p>
          <Link href="/docs/cli/push" className="button secondary">
            Read the push guide
          </Link>
        </div>
      ) : null}
      {active && (
        <section className="detail-panel" aria-label="Decrypted file">
          <header>
            <div>
              <h2>{active.envName}</h2>
              <p className="notice">
                <Fingerprint size={12} /> Decrypted locally in this browser
              </p>
            </div>
            <div className="actions">
              {plaintext !== null && (
                <>
                  <CopyButton value={plaintext} label="Copy file contents" />
                  <button
                    className="quiet"
                    onClick={download}
                    aria-label="Download decrypted file"
                  >
                    <Download size={18} />
                  </button>
                </>
              )}
              <button
                className="quiet"
                onClick={() => {
                  setActive(null);
                  setPlaintext(null);
                }}
                aria-label="Hide file contents"
              >
                <X size={18} />
              </button>
            </div>
          </header>
          <pre>{plaintext ?? "Decrypting…"}</pre>
        </section>
      )}
    </div>
  );
}
