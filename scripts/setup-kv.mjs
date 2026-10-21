#!/usr/bin/env node
/**
 * Creates the Cloudflare KV namespace that holds the partner slot assignments
 * and the merchant intake leads, and records its id for the build.
 *
 *   npm run setup:kv
 *
 * The id is written to the gitignored .env.local as
 * CLOUDFLARE_KV_ANCHOR_STORE_ID. The build copies it into the generated
 * Worker configuration as the ANCHOR_STORE binding, so the store survives a
 * restart and every isolate sees the same records.
 *
 * It needs a Wrangler login (npx wrangler login) or a CLOUDFLARE_API_TOKEN in
 * the environment.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = resolve(root, '.env.local');
const NAMESPACE = 'ANCHOR_STORE';

function run(args) {
  return new Promise((resolvePromise) => {
    const child = spawn('npx', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => resolvePromise({ code, output }));
    child.on('error', (error) => resolvePromise({ code: 1, output: String(error) }));
  });
}

function readEnvFile() {
  if (!existsSync(ENV_FILE)) return '';
  return readFileSync(ENV_FILE, 'utf8');
}

const created = await run(['wrangler', 'kv', 'namespace', 'create', NAMESPACE]);
if (created.code !== 0) {
  console.error(created.output.trim());
  console.error(
    '\nWrangler could not create the namespace. Sign in with "npx wrangler login" or set CLOUDFLARE_API_TOKEN.',
  );
  process.exit(1);
}

const id = created.output.match(/\b([0-9a-f]{32})\b/)?.[1];
if (!id) {
  console.error(created.output.trim());
  console.error('\nCould not read the namespace id from the Wrangler output.');
  process.exit(1);
}

const envFile = readEnvFile();
const line = `CLOUDFLARE_KV_ANCHOR_STORE_ID=${id}`;
const next = envFile.includes('CLOUDFLARE_KV_ANCHOR_STORE_ID=')
  ? envFile.replace(/CLOUDFLARE_KV_ANCHOR_STORE_ID=.*/g, line)
  : `${envFile.replace(/\n*$/, '\n')}\n# The partner portal store (Cloudflare KV namespace).\n${line}\n`;

writeFileSync(ENV_FILE, next);
console.log(`Namespace ${NAMESPACE} created (${id}).`);
console.log('The id is recorded in .env.local and picked up by the next build.');
console.log('Run "npm run build" and deploy to bind it to the Worker.');
