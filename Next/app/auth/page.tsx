import { ArrowUpRight, Fingerprint, Github } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Connect GitHub" };
export default function Auth() {
  return (
    <section className="page wrap">
      <div className="auth-layout">
        <div className="auth-copy">
          <div className="eyebrow">
            <Fingerprint size={15} /> Your workspace, connected
          </div>
          <h1>
            Good work starts
            <br />
            with the right
            <br />
            <span style={{ color: "var(--accent)" }}>environment.</span>
          </h1>
          <p>
            Connect your GitHub account to access your repositories and
            encrypted environment files.
          </p>
        </div>
        <div className="auth-card">
          <Github size={30} />
          <h2 style={{ marginTop: 24 }}>Welcome to Vathavaran.</h2>
          <p>One account for your terminal, browser, and phone.</p>
          <a
            className="button"
            href={`${process.env.APP_URL || "http://localhost:3000"}/api/auth/github?browser=1`}
          >
            Continue with GitHub <ArrowUpRight size={17} />
          </a>
          <p className="auth-note">
            We request repository access to verify that you can read or write
            environment files. Your file contents remain encrypted in storage.
          </p>
        </div>
      </div>
    </section>
  );
}
