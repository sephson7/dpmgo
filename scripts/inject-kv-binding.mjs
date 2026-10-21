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
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = resolve(root, '.env.local');
const BINDING = 'ANCHOR_STORE';

/** Output roots nitro may have written the Worker into. */
const OUTPUT_ROOTS = ['.output', 'dist'];
const CONFIG_NAME = 'wrangler.json';
const MAX_SCAN_DEPTH = 3;

function namespaceId() {
  if (process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID) return process.env.CLOUDFLARE_KV_ANCHOR_STORE_ID;
  if (!existsSync(ENV_FILE)) return null;
  const match = readFileSync(ENV_FILE, 'utf8').match(/^CLOUDFLARE_KV_ANCHOR_STORE_ID=(.*)$/m);
  return match?.[1]?.trim() || null;
}

/** Bounded lookup for the Worker config so a new output layout still works. */
function scan(dir, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...scan(path, depth + 1));
    else if (entry.name === CONFIG_NAME) found.push(path);
  }
  return found;
}

/**
 * Every Worker config this build produced. Nitro's manifest names the server
 * entry, so the config sits next to it; the fixed locations and a bounded scan
 * cover the layouts that do not ship a manifest.
 */
function findWorkerConfigs() {
  const found = [];
  const seen = new Set();
  const add = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    found.push(path);
  };

  for (const outputRoot of OUTPUT_ROOTS) {
    const base = resolve(root, outputRoot);
    if (!existsSync(base)) continue;

    const manifest = join(base, 'nitro.json');
    if (existsSync(manifest)) {
      try {
        const { serverEntry } = JSON.parse(readFileSync(manifest, 'utf8'));
        if (typeof serverEntry === 'string' && serverEntry) {
          const serverDir = dirname(resolve(base, serverEntry));
          add(join(serverDir, CONFIG_NAME));
        }
      } catch {
        // The manifest is only a hint, the fixed locations still apply.
      }
    }

    add(join(base, 'server', CONFIG_NAME));
    add(join(base, CONFIG_NAME));

    for (const path of scan(base)) add(path);
  }

  return found.filter((path) => existsSync(path));
}

const configs = findWorkerConfigs();

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
