import {
  Check,
  FileKey2,
  Fingerprint,
  Folder,
  GitBranch,
  Terminal,
} from "lucide-react";

export function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-signal" aria-hidden="true">
        <svg viewBox="0 0 680 520" fill="none">
          <path
            className="signal-track"
            d="M40 240V100Q40 70 70 70H510Q540 70 540 40"
          />
          <path
            className="signal-track"
            d="M160 420V470Q160 490 180 490H600Q630 490 630 460V300"
          />
          <path
            className="signal-packet"
            pathLength="1"
            d="M40 240V100Q40 70 70 70H510Q540 70 540 40"
          />
          <path
            className="signal-packet signal-packet-delayed"
            pathLength="1"
            d="M160 420V470Q160 490 180 490H600Q630 490 630 460V300"
          />
          <circle cx="540" cy="40" r="4" />
          <circle cx="630" cy="300" r="4" />
        </svg>
      </div>
      <div className="phone-preview" aria-hidden="true">
        <span className="phone-speaker" />
        <span className="phone-brand">v.</span>
        <FileKey2 size={22} />
        <span className="phone-file">.env</span>
        <span className="phone-line" />
        <span className="phone-line short" />
        <span className="phone-saved">
          <Check size={11} /> In sync
        </span>
      </div>
      <div
        className="workspace-preview"
        role="img"
        aria-label="Example workspace with an encrypted environment file and a successful CLI pull"
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
              orbit / platform <span className="tag">Private</span>
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
            <span className="terminal-cursor" aria-hidden="true" />
          </code>
          <p>
            <Check size={14} /> Environment file saved to .env
          </p>
        </div>
      </div>
    </div>
  );
}
