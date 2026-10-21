#!/usr/bin/env node
/**
 * Adds the partner portal KV binding to the generated Worker configuration.
 *
 *   npm run build
 *
 * The build writes .output/server/wrangler.json, so the binding is injected
 * here from the namespace id in CLOUDFLARE_KV_ANCHOR_STORE_ID (or the same
 * key in .env.local). Without an id the Worker keeps the local file fallback
 * and nothing changes.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = resolve(root, '.output/server/wrangler.json');
const ENV_FILE = resolve(root, '.env.local');
const BINDING = 'ANCHOR_STORE';

function namespaceId() {
  if (process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID) return process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID;
  if (!existsSync(ENV_FILE)) return null;
  const match = readFileSync(ENV_FILE, 'utf8').match(/^CLOUDFLARE_KV_ANCHOR_STORE_ID=(.*)$/m);
  return match?.[1]?.trim() || null;
}

if (!existsSync(CONFIG)) {
  console.error('No .output/server/wrangler.json. Run the build first.');
  process.exit(1);
}

const id = namespaceId();
if (!id) {
  console.log('No CLOUDFLARE_KV_ANCHOR_STORE_ID, the Worker keeps the local file fallback.');
  process.exit(0);
}

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
config.kv_namespaces = [
  ...(config.kv_namespaces ?? []).filter((entry) => entry.binding !== BINDING),
  { binding: BINDING, id },
];
writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Bound ${BINDING} to the KV namespace ${id}.`);
