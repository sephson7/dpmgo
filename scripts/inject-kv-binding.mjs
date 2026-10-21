#!/usr/bin/env node
/**
 * Adds the partner portal KV binding to the generated Worker configuration.
 *
 *   npm run build
 *
 * The build writes the Worker config next to the server bundle, but the folder
 * depends on the environment: nitro's default output is
 * `.output/server/wrangler.json`, while the Lovable build environment emits
 * `dist/server/wrangler.json`. The binding is injected here from the namespace
 * id in CLOUDFLARE_KV_ANCHOR_STORE_ID (or the same key in .env.local). Without
 * an id the Worker keeps the local file fallback and nothing changes.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { CONFIG_NAME, OUTPUT_ROOTS, findWorkerConfigs } from './lib/worker-config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = resolve(root, '.env.local');
const BINDING = 'ANCHOR_STORE';

function namespaceId() {
  if (process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID) return process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID;
  if (!existsSync(ENV_FILE)) return null;
  const match = readFileSync(ENV_FILE, 'utf8').match(/^CLOUDFLARE_KV_ANCHOR_STORE_ID=(.*)$/m);
  return match?.[1]?.trim() || null;
}

const configs = findWorkerConfigs(root);

if (!configs.length) {
  console.warn(
    `No ${CONFIG_NAME} found under ${OUTPUT_ROOTS.map((dir) => `${dir}/`).join(' or ')}. ` +
      `The ${BINDING} binding was not injected, so the Worker keeps the local file fallback.`,
  );
  process.exit(0);
}

const id = namespaceId();
if (!id) {
  console.log('No CLOUDFLARE_KV_ANCHOR_STORE_ID, the Worker keeps the local file fallback.');
  process.exit(0);
}

for (const config of configs) {
  const parsed = JSON.parse(readFileSync(config, 'utf8'));
  parsed.kv_namespaces = [
    ...(parsed.kv_namespaces ?? []).filter((entry) => entry.binding !== BINDING),
    { binding: BINDING, id },
  ];
  writeFileSync(config, `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(`Bound ${BINDING} to the KV namespace ${id} in ${relative(root, config)}.`);
}
