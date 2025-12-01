import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck, FaGithub, FaTerminal } from 'react-icons/fa';

const Docs = () => {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id }) => (
    <div className="relative group">
      <div className="flex items-center gap-2 mb-2">
        <FaTerminal className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Terminal</span>
      </div>
      <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-foreground">
          {code.split('\n').map((line, i) => {
            if (line.startsWith('#')) {
              return <div key={i} className="text-muted-foreground">{line}</div>;
            }
            if (line.startsWith('npm') || line.startsWith('varte') || line.startsWith('git') || line.startsWith('cd')) {
              const parts = line.split(' ');
              return (
                <div key={i}>
                  <span className="text-primary">{parts[0]}</span>
                  <span className="text-foreground">{' '}{parts.slice(1).join(' ')}</span>
                </div>
              );
            }
            return <div key={i}>{line}</div>;
          })}
        </pre>
      </div>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-8 right-2 p-2 rounded-md bg-muted/80 hover:bg-muted transition-opacity opacity-0 group-hover:opacity-100"
      >
        {copiedId === id ? (
          <FaCheck className="h-3.5 w-3.5 text-primary" />
        ) : (
          <FaCopy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );

  const CommandCard = ({ title, description, code, id, options }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-xl p-6 space-y-4"
    >
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <CodeBlock code={code} id={id} />
      
      {options && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">Options</p>
          <div className="grid gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <code className="shrink-0 px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs">
                  {opt.flag}
                </code>
                <span className="text-muted-foreground">{opt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'oklch(var(--background))' }}>
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            CLI Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your environment variables directly from your terminal with seamless GitHub integration.
          </p>
        </motion.div>

        {/* Installation */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Installation
          </h2>
          <p className="text-muted-foreground mb-6">
            Install the CLI globally to access it from any directory.
          </p>
          <CodeBlock code="npm install -g varte" id="install" />
        </motion.section>

        {/* Quick Start */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Quick Start
          </h2>
          <p className="text-muted-foreground mb-6">
            Get up and running in three simple steps.
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground mb-3">Login with GitHub</p>
                <CodeBlock code="varte login" id="qs-1" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground mb-3">Push your .env file</p>
                <CodeBlock code="varte push" id="qs-2" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground mb-3">Pull from anywhere</p>
                <CodeBlock code="varte pull" id="qs-3" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Commands */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Commands
          </h2>
          <p className="text-muted-foreground mb-6">
            All available commands and their options.
          </p>
          
          <div className="space-y-4">
            <CommandCard
              title="push"
              description="Encrypt and upload your environment variables to the cloud."
              code={`varte push
varte push -f .env.production
varte push --owner myorg --repo myapp`}
              id="cmd-push"
              options={[
                { flag: '-f, --file', desc: 'Path to env file (default: .env)' },
                { flag: '-o, --owner', desc: 'Repository owner' },
                { flag: '-r, --repo', desc: 'Repository name' },
                { flag: '-d, --directory', desc: 'Directory path' },
                { flag: '-n, --name', desc: 'Custom filename' },
              ]}
            />
            
            <CommandCard
              title="pull"
              description="Download and decrypt your environment variables."
              code={`varte pull
varte pull --output .env.local
varte pull -d backend`}
              id="cmd-pull"
              options={[
                { flag: '-o, --owner', desc: 'Repository owner' },
                { flag: '-r, --repo', desc: 'Repository name' },
                { flag: '-d, --directory', desc: 'Directory path' },
                { flag: '--output', desc: 'Output file path' },
              ]}
            />
            
            <CommandCard
              title="list"
              description="Display all stored environment files grouped by repository."
              code="varte list"
              id="cmd-list"
            />
            
            <CommandCard
              title="logout"
              description="Remove stored credentials from your machine."
              code="varte logout"
              id="cmd-logout"
            />
          </div>
        </motion.section>

        {/* Examples */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Examples
          </h2>
          <p className="text-muted-foreground mb-6">
            Common workflows and use cases.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">Deploy a new project</h3>
              <CodeBlock 
                code={`git clone https://github.com/myorg/myapp.git
cd myapp
varte pull
npm install && npm start`}
                id="ex-1"
              />
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">Multiple environments</h3>
              <CodeBlock 
                code={`varte push -f .env.production -n production
varte push -f .env.staging -n staging
varte push -f .env.dev -n development`}
                id="ex-2"
              />
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">Monorepo workflow</h3>
              <CodeBlock 
                code={`# Push each service's env
varte push -d backend
varte push -d frontend

# Pull specific service
varte pull -d backend`}
                id="ex-3"
              />
            </div>
          </div>
        </motion.section>

        {/* Security */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Security
          </h2>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid gap-4">
              <div className="flex gap-3">
                <div className="shrink-0 w-1 bg-primary rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">End-to-End Encryption</p>
                  <p className="text-sm text-muted-foreground">Variables are encrypted before leaving your machine.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-1 bg-primary rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">GitHub OAuth</p>
                  <p className="text-sm text-muted-foreground">Secure authentication—no passwords stored locally.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-1 bg-primary rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Repository Permissions</p>
                  <p className="text-sm text-muted-foreground">Only users with push access can store env files.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Need help or found an issue?
            </p>
            <a
              href="https://github.com/wrestle-R/Vathavaran-Variables"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <FaGithub className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Docs;
