import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const candidates = ['tailscale', '/Applications/Tailscale.app/Contents/MacOS/Tailscale'];
const executable = candidates.find(path => (path === 'tailscale' || existsSync(path)) && !spawnSync(path, ['version'], { encoding: 'utf8' }).error);
if (!executable) {
  console.error('Install Tailscale, open it, and sign in first: brew install --cask tailscale');
  process.exit(1);
}
const status = spawnSync(executable, ['status', '--json'], { encoding: 'utf8' });
let state;
try { state = JSON.parse(status.stdout); } catch { /* handled below */ }
const name = state?.Self?.DNSName?.replace(/\.$/, '');
if (status.status !== 0 || state?.BackendState !== 'Running' || !name || !/^[a-zA-Z0-9.-]+\.ts\.net$/.test(name)) {
  console.error('Open Tailscale, sign in, and connect this computer before running npm run start:private.');
  process.exit(1);
}
const origin = 'https://' + name;
const server = spawn(process.execPath, [join(root, 'server.mjs')], {
  cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: '3000', NODE_ENV: 'production', HERO_ORIGIN: origin },
  stdio: ['ignore', 'pipe', 'inherit']
});
let published = false;
let setupFailed = false;
server.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  if (!published && chunk.toString().includes('running at')) {
    published = true;
    const serving = spawnSync(executable, ['serve', '--bg', 'http://127.0.0.1:3000'], { stdio: 'inherit' });
    if (serving.status !== 0) { setupFailed = true; console.error('Tailscale Serve needs setup. Follow its displayed HTTPS instructions, then retry.'); server.kill('SIGTERM'); return; }
    console.log(`Private HERO: ${origin}/account.html\nRegister ${origin} as an Authorized JavaScript origin in Google Cloud.\nConnect your other devices to your private Tailscale network, then open this URL.\nKeep this computer and this process running. Ctrl+C stops HERO.`);
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = setupFailed ? 1 : (code || 0); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
