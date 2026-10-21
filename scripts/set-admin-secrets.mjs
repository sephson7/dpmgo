#!/usr/bin/env node
/**
 * Publishes the partner portal secrets to the deployed Cloudflare Worker.
 *
 *   node scripts/set-admin-secrets.mjs
 *
 * The values are read from the process environment or from the gitignored
 * `.env.local` file and are piped straight into `wrangler secret put`, so
 * they never appear in a command line, in the shell history or in a build
 * log. Nothing is written to the repository.
 *
 * The portal fails closed: if any of the three secrets is missing the
 * `/admin` page and the `/api/admin/*` routes answer 503.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { findWorkerConfigs } from './lib/worker-config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'];

/** The Worker name: the flag wins, then the name the build wrote out. */
function workerName() {
  const flagIndex = process.argv.indexOf('--name');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) return process.argv[flagIndex + 1];
  for (const built of findWorkerConfigs(root)) {
    const { name } = JSON.parse(readFileSync(built, 'utf8'));
    if (name) return name;
  }
  console.error('No Worker name. Pass --name <worker> or run "npm run build" first.');
  process.exit(1);
}

const WORKER = workerName();

function localEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
    const values = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      values[trimmed.slice(0, index).trim()] = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
    return values;
  } catch {
    return {};
  }
}

const file = localEnv();
const secrets = NAMES.map((name) => {
  const value = process.env[name] ?? file[name];
  if (!value) {
    console.error(`Missing ${name}. Set it in .env.local or in the environment.`);
    process.exit(1);
  }
  return { name, value };
});

function put({ name, value }) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('npx', ['wrangler', 'secret', 'put', name, '--name', WORKER], {
      cwd: root,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    });
    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`wrangler secret put ${name} exited with ${code}`));
    });
    child.stdin.write(`${value}\n`);
    child.stdin.end();
  });
}

for (const secret of secrets) {
  console.log(`Setting ${secret.name} on the Worker ${WORKER}…`);
  await put(secret);
}

console.log('\nThe partner portal is configured. Sign in at /admin.');
