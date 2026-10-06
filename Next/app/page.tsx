import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  GitBranch,
  Smartphone,
  Terminal,
  Check,
  Folder,
  FileKey2,
} from "lucide-react";
import { CopyButton } from "@/components/copy";
import { CliBenchmark } from "@/components/cli-benchmark";
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> A quieter way to manage secrets
          </div>
          <h1>
            Your environment.
            <br />
            <span>Always in sync.</span>
          </h1>
          <p className="hero-description">
            The right variables, wherever you build. Encrypted environment files
            for your team’s GitHub repositories—across terminal, web, and
            mobile.
          </p>
          <div className="hero-actions">
            <Link href="/auth" className="button">
              Open your workspace <ArrowUpRight size={17} />
            </Link>
            <Link href="/docs" className="text-link">
              Meet the CLI <ArrowRight size={16} />
            </Link>
          </div>
          <div className="install-line">
            <span className="prompt">$</span>
            <code>npm install -g varte</code>
            <CopyButton value="npm install -g varte" />
          </div>
          <p className="hero-footnote">
            Built for developers. Connected to GitHub.
          </p>
        </div>
        <div
          className="workspace-preview"
          aria-label="Example repository workspace"
        >
          <div className="window-top">
            <span className="window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>Workspace / environment files</span>
            <span className="preview-status">● Connected</span>
          </div>
          <div className="preview-body">
            <div className="preview-nav">
              <span className="mini-brand">v.</span>
              <Folder size={19} />
              <FileKey2 size={19} />
              <Terminal size={19} />
            </div>
            <div className="preview-content">
              <div className="preview-crumb">
                acme / platform <span className="tag">Private</span>
              </div>
              <div className="preview-heading">
                <h2>Everything in its place.</h2>
                <GitBranch size={19} />
              </div>
              <p className="muted">Environment files / production</p>
              <div className="preview-file">
                <FileKey2 size={21} />
                <div>
                  <strong>.env.production</strong>
                  <span>backend / uploaded by your team</span>
                </div>
                <span className="encrypted-label">
                  <Fingerprint size={13} /> Encrypted
                </span>
              </div>
              <div className="code-preview">
                <div>
                  <span>01</span>
                  <b>DATABASE_URL</b>
                  <i>=</i>
                  <em>••••••••••••••••••••••••</em>
                </div>
                <div>
                  <span>02</span>
                  <b>GITHUB_CLIENT_ID</b>
                  <i>=</i>
                  <em>••••••••••••••</em>
                </div>
                <div>
                  <span>03</span>
                  <b>API_SECRET</b>
                  <i>=</i>
                  <em>••••••••••••••••••••</em>
                </div>
              </div>
              <div className="preview-bottom">
                <span>
                  <Check size={14} /> Ready for your next pull
                </span>
                <span>3 variables</span>
              </div>
            </div>
          </div>
          <div className="terminal-overlay">
            <div>
              <Terminal size={14} /> varte / terminal
            </div>
            <code>
              <span>$</span> varte pull -d backend
            </code>
            <p>
              <Check size={14} /> Environment file saved to .env
            </p>
          </div>
        </div>
      </section>
      <div className="principles wrap">
        <span>
          <Fingerprint size={16} /> Encrypted before upload
        </span>
        <span>
          <GitBranch size={16} /> Built around your repositories
        </span>
        <span>
          <Smartphone size={16} /> Terminal to pocket
        </span>
      </div>
      <CliBenchmark />
      <section className="section wrap">
        <div className="section-heading">
          <p className="eyebrow">Less friction. More focus.</p>
          <h2>
            Setup shouldn’t
            <br />
            slow your team down.
          </h2>
          <p>
            Stop passing secrets around in messages. Give every environment a
            home, and every collaborator a clear way to get started.
          </p>
        </div>
        <div className="feature-layout">
          <article className="feature-large">
            <span className="feature-number">01 / THE WORKFLOW</span>
            <h3>
              From a fresh clone
              <br />
              to a running project.
            </h3>
            <p>
              Connect GitHub, choose a repository, and pull the environment you
              need. No hunting through old messages.
            </p>
            <div className="workflow">
              <div>
                <span>1</span>
                <code>varte login</code>
                <Check size={15} />
              </div>
              <div>
                <span>2</span>
                <code>varte push -f .env</code>
                <Check size={15} />
              </div>
              <div>
                <span>3</span>
                <code>varte pull --output .env</code>
                <ArrowRight size={15} />
              </div>
            </div>
          </article>
          <div className="feature-stack">
            <article>
              <Fingerprint className="feature-icon" size={25} />
              <h3>Your files stay encrypted.</h3>
              <p>
                Files are encrypted before upload and stay encrypted in storage.
                Your GitHub access determines which files you can open.
              </p>
            </article>
            <article>
              <GitBranch className="feature-icon" size={25} />
              <h3>A shared source of context.</h3>
              <p>
                Browse files by repository and directory. See who uploaded each
                version and when it changed.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="section platforms wrap">
        <div>
          <p className="eyebrow">One workspace. Three ways in.</p>
          <h2>
            Wherever work
            <br />
            finds you.
          </h2>
        </div>
        <div className="platform-list">
          <article>
            <Terminal size={23} />
            <div>
              <h3>In your terminal</h3>
              <p>A native Go CLI. The familiar npm install.</p>
            </div>
            <Link href="/docs" aria-label="Read CLI documentation">
              <ArrowUpRight size={21} />
            </Link>
          </article>
          <article>
            <Folder size={23} />
            <div>
              <h3>In your browser</h3>
              <p>Your repositories, files, and team context.</p>
            </div>
            <Link href="/dashboard" aria-label="Open web workspace">
              <ArrowUpRight size={21} />
            </Link>
          </article>
          <article>
            <Smartphone size={23} />
            <div>
              <h3>On your phone</h3>
              <p>Find and copy your environment files wherever you are.</p>
            </div>
          </article>
        </div>
      </section>
      <section className="cta wrap">
        <p className="eyebrow">Your next project starts here</p>
        <h2>
          Keep your team
          <br />
          <span>in the same environment.</span>
        </h2>
        <Link href="/auth" className="button">
          Connect with GitHub <ArrowUpRight size={17} />
        </Link>
        <p>No new account. Use the GitHub account you already have.</p>
      </section>
    </>
  );
}
