import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Fingerprint, GitBranch, Github, Smartphone, Terminal, Globe, LockKeyhole } from "lucide-react";
import { CopyButton } from "@/components/copy";
import { CliBenchmark } from "@/components/cli-benchmark";

export default function Home() {
  return (
    <div className="landing remake">
      <section className="remake-hero wrap" aria-labelledby="hero-title">
        <div className="remake-hero-copy">
          <p className="remake-eyebrow"><GitBranch size={15} /> YOUR ENVIRONMENT, CONNECTED</p>
          <h1 id="hero-title">Less setup.<br /><span>More shipping.</span></h1>
          <p className="remake-description">Your team’s secrets, always in sync. Encrypted environment files across terminal, web, and mobile.</p>
          <div className="remake-actions">
            <Link href="/auth" className="button"><Github size={18} /> Open your workspace <ArrowUpRight size={17} /></Link>
            <Link href="/docs" className="text-link">Meet the CLI <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="remake-art">
          <Image src="/images/environment-link.webp" alt="Two interlocking mint glass and graphite loops" width={1024} height={1024} priority sizes="(max-width: 760px) 100vw, 50vw" />
        </div>
      </section>

      <div className="remake-install wrap">
        <div><Terminal size={19} /><span>A native Go CLI.<br /><strong>The familiar npm install.</strong></span></div>
        <div className="remake-install-command"><span className="prompt">$</span><code>npm install -g varte</code><CopyButton value="npm install -g varte" /></div>
        <Link href="/docs/installation" className="text-link">Installation guide <ArrowUpRight size={16} /></Link>
      </div>

      <section className="remake-workflow wrap" aria-labelledby="workflow-title">
        <div className="remake-heading"><h2 id="workflow-title">A fresh clone.<br /><span>A running project.</span></h2><p>Stop passing secrets around in messages. Give every environment a home, and every collaborator a clear way to get started.</p></div>
        <div className="remake-workflow-grid">
          <div className="remake-steps">
            <article><span className="remake-step">01</span><div><h3>Connect your GitHub.</h3><p>Your repositories. Your existing access. One less account to manage.</p><code>varte login</code></div></article>
            <article><span className="remake-step">02</span><div><h3>Give your secrets a home.</h3><p>Upload your environment file, encrypted before it leaves your device.</p><code>varte push -f .env</code></div></article>
            <article><span className="remake-step">03</span><div><h3>Get your team in sync.</h3><p>Pull the right file and get back to building. No hunting through old messages.</p><code>varte pull --output .env</code></div></article>
          </div>
          <div className="remake-terminal" aria-label="Example CLI workflow">
            <div className="remake-terminal-top"><Terminal size={16} /><span>~/your-next-project</span><span>zsh</span></div>
            <div className="remake-terminal-body"><p className="terminal-comment"># Good to go, from the first pull.</p><p><span>$</span> varte login</p><p className="terminal-success"><Check size={14} /> Connected to GitHub</p><p><span>$</span> varte pull --output .env</p><p className="terminal-success"><Check size={14} /> Environment file saved</p><p><span>$</span> npm run dev<span className="remake-cursor" aria-hidden="true" /></p></div>
            <div className="remake-terminal-bottom"><LockKeyhole size={13} /> Encrypted in transit. Encrypted in storage.</div>
          </div>
        </div>
      </section>

      <section className="remake-security wrap" aria-labelledby="security-title">
        <div className="remake-security-intro"><Fingerprint size={45} strokeWidth={1.2} /><h2 id="security-title">Shared context.<br /><span>Protected secrets.</span></h2><Link href="/docs/security" className="text-link">Explore security & access <ArrowUpRight size={16} /></Link></div>
        <div className="remake-security-details"><article><LockKeyhole size={23} /><h3>Your files stay encrypted.</h3><p>Files are encrypted before upload and stay encrypted in storage. Your GitHub access determines which files you can open.</p></article><article><GitBranch size={23} /><h3>A shared source of context.</h3><p>Browse files by repository and directory. See who uploaded each version and when it changed.</p></article></div>
      </section>

      <CliBenchmark />

      <section className="remake-platforms wrap" aria-labelledby="platforms-title">
        <div className="remake-heading"><h2 id="platforms-title">One workspace.<br /><span>Wherever you build.</span></h2></div>
        <div className="remake-platform-grid">
          <Link href="/docs" className="remake-platform"><Terminal size={28} /><h3>In your terminal</h3><p>A native Go CLI that fits right into your workflow.</p><span>Explore the CLI <ArrowUpRight size={17} /></span></Link>
          <Link href="/dashboard" className="remake-platform"><Globe size={28} /><h3>In your browser</h3><p>Your repositories, files, and team context. All in one place.</p><span>Open web workspace <ArrowUpRight size={17} /></span></Link>
          <article className="remake-platform"><Smartphone size={28} /><h3>On your phone</h3><p>Find and copy your environment files wherever work finds you.</p><span className="remake-platform-note">Your workspace, on the go.</span></article>
        </div>
      </section>
      <section className="remake-cta wrap" aria-labelledby="cta-title"><div><p>YOUR NEXT PROJECT STARTS HERE</p><h2 id="cta-title">Same team.<br /><span>Same environment.</span></h2></div><div className="remake-cta-actions"><Link href="/auth" className="button"><Github size={18} /> Connect with GitHub <ArrowUpRight size={18} /></Link><p>No new account.<br />Use the GitHub account you already have.</p></div></section>
    </div>
  );
}
