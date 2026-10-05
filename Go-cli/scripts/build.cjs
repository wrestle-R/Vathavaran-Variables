'use strict';
const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const root = join(__dirname, '..');
const version = require('../package.json').version;
const targets = [['linux', 'amd64', 'linux-x64'], ['linux', 'arm64', 'linux-arm64'], ['darwin', 'amd64', 'darwin-x64'], ['darwin', 'arm64', 'darwin-arm64'], ['windows', 'amd64', 'win32-x64'], ['windows', 'arm64', 'win32-arm64']];
const checksums = [];
for (const [goos, goarch, platform] of targets) {
  const directory = join(root, 'bin', platform);
  mkdirSync(directory, { recursive: true });
  const name = goos === 'windows' ? 'varte.exe' : 'varte';
  const destination = join(directory, name);
  const result = spawnSync('go', ['build', '-trimpath', '-ldflags', `-s -w -X github.com/wrestle-R/Vathavaran-Variables/Go-cli/internal/varte.Version=${version}`, '-o', destination, './cmd/varte'], { cwd: root, stdio: 'inherit', env: { ...process.env, GOOS: goos, GOARCH: goarch, CGO_ENABLED: '0' } });
  if (result.error || result.status !== 0) { console.error(`Build failed for ${platform}`); process.exit(1); }
  checksums.push(`${createHash('sha256').update(readFileSync(destination)).digest('hex')}  ${platform}/${name}`);
  console.log(`Built ${platform}`);
}
writeFileSync(join(root, 'bin', 'SHA256SUMS'), checksums.join('\n') + '\n');
