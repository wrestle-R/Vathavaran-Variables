import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github, GitBranch, Fingerprint, Globe, Smartphone, Terminal, LockKeyhole, FolderGit2 } from "lucide-react";
import { LandingCli } from "@/components/landing-cli";
import { CliBenchmark } from "@/components/cli-benchmark";

export default function Home() {
  return (
    <div className="landing launch">
      <section className="launch-hero launch-wrap" aria-labelledby="hero-title">
        <div className="launch-label"><GitBranch size={14} /> Built around your GitHub workflow</div>
        <h1 id="hero-title">Your secrets.<br /><span>In the right hands.</span></h1>
        <p>One home for your team’s environment files.<br className="launch-desktop-break" /> Encrypted, organized, and ready wherever you build.</p>
        <div className="launch-actions"><Link className="button" href="/auth"><Github size={18} /> Open your workspace <ArrowUpRight size={17} /></Link><Link className="launch-secondary" href="/docs">Read the docs <ArrowRight size={16} /></Link></div>
        <div className="launch-hero-product">
          <div className="launch-product-copy"><span className="launch-product-icon"><Terminal size={26} /></span><h2>Clone. Pull. Ship.</h2><p>The right variables should be the easy part. Get your environment from your terminal and get back to the work that matters.</p><Link href="/docs/quickstart">Meet the CLI <ArrowUpRight size={16} /></Link><div className="launch-product-meta"><span>Native Go binary</span><span>Installed through npm</span></div></div>
          <LandingCli />
        </div>
      </section>

      <section className="launch-workflow launch-wrap" aria-labelledby="workflow-title">
        <div className="launch-section-heading"><h2 id="workflow-title">From “send me the .env”<br />to already in sync.</h2><p>A familiar workflow. A lot less back and forth.</p></div>
        <div className="launch-steps">
          <article><div className="launch-step-top"><Github size={23} /><span>01</span></div><h3>Connect your GitHub.</h3><p>Use your existing account and repository access. No new permissions system to manage.</p><code>varte login</code></article>
          <article><div className="launch-step-top"><LockKeyhole size={23} /><span>02</span></div><h3>Upload once. Stay protected.</h3><p>Give your environment files a shared home. They’re encrypted before they leave your device.</p><code>varte push -f .env</code></article>
          <article><div className="launch-step-top"><FolderGit2 size={23} /><span>03</span></div><h3>Pull it. Get to work.</h3><p>Get the files you need for your next project, without digging through yesterday’s messages.</p><code>varte pull --output .env</code></article>
        </div>
      </section>

      <section className="launch-features launch-wrap" aria-labelledby="security-title">
        <article className="launch-security"><div className="launch-security-copy"><Fingerprint size={30} /><h2 id="security-title">Share the work.<br />Protect the secrets.</h2><p>Encrypted before upload. Encrypted in storage. Accessible through your existing GitHub permissions.</p><Link href="/docs/security">Explore security & access <ArrowUpRight size={16} /></Link></div><Image src="/images/environment-link.webp" alt="Interlocking glass and metal forms representing a protected connection" width={1024} height={1024} sizes="(max-width: 760px) 85vw, 40vw" /></article>
        <div className="launch-feature-stack"><article><GitBranch size={24} /><h3>Context that stays with your code.</h3><p>Browse by repository and directory. See who uploaded each version and when it changed.</p><Link href="/dashboard">Explore your workspace <ArrowUpRight size={16} /></Link></article><article><div className="launch-device-icons"><Terminal size={23} /><Globe size={23} /><Smartphone size={23} /></div><h3>Your workspace goes with you.</h3><p>Use the native CLI, manage files in your browser, or find and copy them on your phone.</p><Link href="/docs/guides/mobile">Meet the mobile app <ArrowUpRight size={16} /></Link></article></div>
      </section>
      <CliBenchmark />
      <section className="launch-faq launch-wrap" aria-labelledby="faq-title"><h2 id="faq-title">A few things worth knowing.</h2><div><details><summary>Do I need another account?</summary><p>No. Sign in with the GitHub account you already use. Your repository access determines which files you can open.</p></details><details><summary>How are my environment files protected?</summary><p>Files are encrypted before upload and remain encrypted in storage. Read the <Link href="/docs/security">security documentation</Link> for details about encryption and access.</p></details><details><summary>Can I use this from my terminal?</summary><p>Yes. Install with <code>npm install -g varte</code>, then use the native Go CLI to sign in, upload, and pull files. The <Link href="/docs/quickstart">quickstart guide</Link> walks through each step.</p></details></div></section>
      <section className="launch-cta launch-wrap" aria-labelledby="cta-title"><span className="launch-product-icon"><GitBranch size={25} /></span><h2 id="cta-title">Get everyone on<br />the same environment.</h2><p>Your next project starts with less setup.</p><Link href="/auth" className="button"><Github size={18} /> Connect with GitHub <ArrowUpRight size={17} /></Link></section>
    </div>
  );
}
