import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Fingerprint,
  GitBranch,
  Smartphone,
  Terminal,
  Check,
  Folder,
} from "lucide-react";
import { CopyButton } from "@/components/copy";
import { CliBenchmark } from "@/components/cli-benchmark";
import { HeroVisual } from "@/components/hero-visual";
export default function Home() {
  return (
    <div className="landing">
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> A quieter way to manage secrets
          </div>
          <h1 id="hero-title">
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
        <HeroVisual />
        <a className="hero-scroll" href="#cli-performance">
          <ArrowDown size={15} /> Explore the CLI
        </a>
      </section>
      <CliBenchmark />
      <section
        className="section features wrap"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Less friction. More focus.</p>
          <h2 id="features-title">
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
      <section
        className="section platforms wrap"
        aria-labelledby="platforms-title"
      >
        <div>
          <p className="eyebrow">One workspace. Three ways in.</p>
          <h2 id="platforms-title">
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
      <section className="cta wrap" aria-labelledby="cta-title">
        <p className="eyebrow">Your next project starts here</p>
        <h2 id="cta-title">
          Keep your team
          <br />
          <span>in the same environment.</span>
        </h2>
        <Link href="/auth" className="button">
          Connect with GitHub <ArrowUpRight size={17} />
        </Link>
        <p>No new account. Use the GitHub account you already have.</p>
      </section>
    </div>
  );
}
