/**
 * Locates the Cloudflare Worker configuration that the build wrote out.
 *
 * The folder depends on the build environment: nitro's default output is
 * `.output/server/wrangler.json`, while the Lovable build environment emits
 * `dist/server/wrangler.json`. Every script that reads the built Worker has
 * to look in both places.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Output roots nitro may have written the Worker into. */
export const OUTPUT_ROOTS = ['.output', 'dist'];
export const CONFIG_NAME = 'wrangler.json';
const MAX_SCAN_DEPTH = 3;

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
 * Every Worker config the last build produced. Nitro's manifest names the
 * server entry, so the config sits next to it; the fixed locations and a
 * bounded scan cover the layouts that do not ship a manifest.
 */
export function findWorkerConfigs(root) {
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
