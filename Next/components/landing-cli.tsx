"use client";

import { useState } from "react";
import { Check, Terminal } from "lucide-react";
import { CopyButton } from "@/components/copy";

const examples = [
  { label: "Connect", command: "varte login", description: "Connect your GitHub account to access your repositories.", output: "Your GitHub permissions determine which repositories you can access." },
  { label: "Push", command: "varte push -f .env", description: "Encrypt and upload an environment file from your project.", output: "Your file is encrypted before upload and stays encrypted in storage." },
  { label: "Pull", command: "varte pull --output .env", description: "Bring your shared environment into your local project.", output: "Save your environment locally, then start building." },
];

export function LandingCli() {
  const [active, setActive] = useState(2);
  const example = examples[active];
  return (
    <div className="launch-cli">
      <div className="launch-cli-header"><span><Terminal size={16} /> The CLI, in three commands</span><span>Go + npm</span></div>
      <div className="launch-cli-tabs" role="tablist" aria-label="CLI command examples">
        {examples.map((item, index) => <button key={item.label} id={`cli-tab-${index}`} role="tab" aria-selected={active === index} aria-controls="cli-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (active + (event.key === "ArrowRight" ? 1 : 2)) % 3; setActive(next); document.getElementById(`cli-tab-${next}`)?.focus(); } }}><span>0{index + 1}</span>{item.label}</button>)}
      </div>
      <div id="cli-panel" role="tabpanel" aria-labelledby={`cli-tab-${active}`} tabIndex={0} className="launch-cli-panel">
        <p>{example.description}</p><div className="launch-command"><span>$</span><code>{example.command}</code><CopyButton value={example.command} /></div>
        <p className="launch-cli-note"><Check size={15} />{example.output}</p>
      </div>
      <div className="launch-cli-install"><code>npm install -g varte</code><CopyButton value="npm install -g varte" /></div>
    </div>
  );
}
