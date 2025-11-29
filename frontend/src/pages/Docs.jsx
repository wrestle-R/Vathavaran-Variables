import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck, FaGithub } from 'react-icons/fa';

const Docs = () => {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, title = 'Terminal' }) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm text-muted-foreground">{title}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="p-1.5 rounded transition-colors bg-background hover:bg-muted"
        >
          {copiedId === id ? (
            <FaCheck className="h-3.5 w-3.5 text-primary" />
          ) : (
            <FaCopy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
      <div className="p-4 font-mono text-sm overflow-x-auto bg-background/50">
        <pre className="text-foreground">
          {code.split('\n').map((line, i) => {
            // Highlight npm commands
            if (line.startsWith('npm')) {
              const parts = line.split(' ');
              return (
                <div key={i}>
                  <span className="text-pink-400">{parts[0]}</span>
                  <span>{' '}</span>
                  <span className="text-cyan-400">{parts.slice(1).join(' ')}</span>
                </div>
              );
            }
            // Highlight vathavaran commands  
            if (line.startsWith('vathavaran')) {
              const parts = line.split(' ');
              return (
                <div key={i}>
                  <span className="text-pink-400">{parts[0]}</span>
                  <span>{' '}</span>
                  <span className="text-cyan-400">{parts.slice(1).join(' ')}</span>
                </div>
              );
            }
            // Comments
            if (line.startsWith('#')) {
              return <div key={i} style={{ color: 'oklch(var(--muted-foreground))' }}>{line}</div>;
            }
            // Other commands like git, cd
            if (line.startsWith('git') || line.startsWith('cd')) {
              const parts = line.split(' ');
              return (
                <div key={i}>
                  <span className="text-pink-400">{parts[0]}</span>
                  <span>{' '}</span>
                  <span className="text-cyan-400">{parts.slice(1).join(' ')}</span>
                </div>
              );
            }
            return <div key={i}>{line}</div>;
          })}
        </pre>
      </div>
    </div>
  );

  const Step = ({ number, title, description, code, id, codeTitle = 'Terminal' }) => (
    <div className="grid md:grid-cols-2 gap-8 items-start py-12" style={{ borderBottom: '1px solid oklch(var(--border))' }}>
      <div className="flex gap-4">
        <div className="shrink-0 w-8 h-8 rounded border flex items-center justify-center text-sm font-medium" style={{ borderColor: 'oklch(var(--border))', color: 'oklch(var(--muted-foreground))' }}>
          {number}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'oklch(var(--foreground))' }}>
            {title}
          </h3>
          <div className="text-base leading-relaxed" style={{ color: 'oklch(var(--muted-foreground))' }}>
            {description}
          </div>
        </div>
      </div>
      <div>
        <CodeBlock code={code} id={id} title={codeTitle} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: 'oklch(var(--background))' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'oklch(var(--foreground))' }}>
            CLI Documentation
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Manage your environment variables directly from your terminal with seamless GitHub integration
          </p>
        </motion.div>

        {/* Installation */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
            Installation
          </h2>
          <p className="mb-8" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Install the Vathavaran CLI globally using npm to manage environment variables from any directory.
          </p>

          <Step
            number="01"
            title="Install the CLI"
            description={
              <p>
                Install <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--foreground))' }}>vathavaran</code> globally using npm. This will give you access to the CLI from anywhere on your system.
              </p>
            }
            code="npm install -g vathavaran"
            id="install"
          />
        </motion.section>

        {/* Quick Start */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
            Quick Start
          </h2>
          <p className="mb-8" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Get started in just three commands. Login, push your environment variables, and pull them anywhere.
          </p>

          <Step
            number="01"
            title="Login with GitHub"
            description={
              <p>
                Authenticate using GitHub OAuth. This will open your browser for secure authentication and store your credentials locally.
              </p>
            }
            code="vathavaran login"
            id="quick-login"
          />

          <Step
            number="02"
            title="Push your environment"
            description={
              <p>
                Encrypt and store your <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--foreground))' }}>.env</code> file securely in the cloud. Your variables are encrypted before leaving your machine.
              </p>
            }
            code="vathavaran push"
            id="quick-push"
          />

          <Step
            number="03"
            title="Pull from anywhere"
            description={
              <p>
                Retrieve your environment variables on any machine. Clone your repo, run pull, and start your app.
              </p>
            }
            code="vathavaran pull"
            id="quick-pull"
          />
        </motion.section>

        {/* Commands */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
            Commands
          </h2>
          <p className="mb-8" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Full list of available commands with all options.
          </p>

          <Step
            number="01"
            title="Push with options"
            description={
              <div className="space-y-3">
                <p>Push environment variables with custom options:</p>
                <ul className="space-y-1 text-sm">
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-f, --file</code> — Path to env file</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-o, --owner</code> — Repository owner</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-r, --repo</code> — Repository name</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-d, --directory</code> — Directory path</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-n, --name</code> — File name</li>
                </ul>
              </div>
            }
            code={`vathavaran push -f .env.production
vathavaran push --owner myorg --repo myapp
vathavaran push -d backend -n production.env`}
            id="cmd-push"
          />

          <Step
            number="02"
            title="Pull with options"
            description={
              <div className="space-y-3">
                <p>Pull environment variables with custom options:</p>
                <ul className="space-y-1 text-sm">
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-o, --owner</code> — Repository owner</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-r, --repo</code> — Repository name</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>-d, --directory</code> — Directory path</li>
                  <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'oklch(var(--muted))', color: 'oklch(var(--primary))' }}>--output</code> — Output file path</li>
                </ul>
              </div>
            }
            code={`vathavaran pull --output .env.local
vathavaran pull --owner myorg --repo myapp
vathavaran pull -d backend`}
            id="cmd-pull"
          />

          <Step
            number="03"
            title="List stored files"
            description={
              <p>
                Display all your stored environment files grouped by repository. See what you have stored at a glance.
              </p>
            }
            code="vathavaran list"
            id="cmd-list"
          />

          <Step
            number="04"
            title="Logout"
            description={
              <p>
                Remove stored credentials from your local machine. Use this when switching accounts or on shared machines.
              </p>
            }
            code="vathavaran logout"
            id="cmd-logout"
          />
        </motion.section>

        {/* Examples */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
            Examples
          </h2>
          <p className="mb-8" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Real-world examples for common workflows.
          </p>

          <Step
            number="01"
            title="Deploy a new project"
            description={
              <p>
                Clone your repo, pull environment variables, and start your application. Perfect for new team members or deployment.
              </p>
            }
            code={`git clone https://github.com/myorg/myapp.git
cd myapp
vathavaran pull
npm install
npm start`}
            id="ex-deploy"
          />

          <Step
            number="02"
            title="Multiple environments"
            description={
              <p>
                Store separate environment files for production, staging, and development. Each gets its own secure storage.
              </p>
            }
            code={`vathavaran push -f .env.production -n production
vathavaran push -f .env.staging -n staging
vathavaran push -f .env.dev -n dev`}
            id="ex-envs"
          />

          <Step
            number="03"
            title="Monorepo workflow"
            description={
              <p>
                Work with monorepos by specifying directory paths. Each service gets its own environment file.
              </p>
            }
            code={`vathavaran push -d backend
vathavaran push -d frontend
vathavaran pull -d backend`}
            id="ex-mono"
          />
        </motion.section>

        {/* Security */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pb-8"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'oklch(var(--foreground))' }}>
            Security
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg" style={{ backgroundColor: 'oklch(var(--card))', border: '1px solid oklch(var(--border))' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
                End-to-End Encryption
              </h3>
              <p className="text-sm" style={{ color: 'oklch(var(--muted-foreground))' }}>
                All environment variables are encrypted before leaving your machine and decrypted only when retrieved.
              </p>
            </div>

            <div className="p-5 rounded-lg" style={{ backgroundColor: 'oklch(var(--card))', border: '1px solid oklch(var(--border))' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
                GitHub OAuth
              </h3>
              <p className="text-sm" style={{ color: 'oklch(var(--muted-foreground))' }}>
                Secure authentication using GitHub's OAuth. No passwords stored locally—just a secure token.
              </p>
            </div>

            <div className="p-5 rounded-lg" style={{ backgroundColor: 'oklch(var(--card))', border: '1px solid oklch(var(--border))' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
                Repository Permissions
              </h3>
              <p className="text-sm" style={{ color: 'oklch(var(--muted-foreground))' }}>
                Only users with push access to a repository can store environment files for it.
              </p>
            </div>

            <div className="p-5 rounded-lg" style={{ backgroundColor: 'oklch(var(--card))', border: '1px solid oklch(var(--border))' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'oklch(var(--foreground))' }}>
                Local Storage
              </h3>
              <p className="text-sm" style={{ color: 'oklch(var(--muted-foreground))' }}>
                Auth tokens are stored securely on your machine using the system keychain.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-12 text-center"
          style={{ borderTop: '1px solid oklch(var(--border))' }}
        >
          <p className="mb-5" style={{ color: 'oklch(var(--muted-foreground))' }}>
            Need help or found an issue?
          </p>
          <a
            href="https://github.com/wrestle-R/Vathavaran-Variables"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: 'oklch(var(--primary))',
              color: 'oklch(var(--primary-foreground))'
            }}
          >
            <FaGithub className="h-5 w-5" />
            View on GitHub
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Docs;
