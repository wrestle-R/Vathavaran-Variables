#!/usr/bin/env node
'use strict';
const { spawn } = require('node:child_process');
const { join } = require('node:path');
const { existsSync, chmodSync } = require('node:fs');
const target = `${process.platform}-${process.arch}`;
const filename = process.platform === 'win32' ? 'varte.exe' : 'varte';
const binary = join(__dirname, '..', 'bin', target, filename);
if (!existsSync(binary)) {
  console.error(`varte: no native binary for ${target}. Supported: Linux, macOS, Windows on x64 and arm64. Build from Go-cli/ with Go 1.23+.`);
  process.exit(1);
}
try { if (process.platform !== 'win32') chmodSync(binary, 0o755); }
catch { /* npm normally preserves executable permissions. */ }
const child = spawn(binary, process.argv.slice(2), { stdio: 'inherit', env: process.env });
child.on('error', () => { console.error('varte: could not start the native CLI. Reinstall the npm package.'); process.exitCode = 1; });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(signal); });
