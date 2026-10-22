#!/usr/bin/env node
// Checks every restaurant website and brand image URL in src/data/transit.ts.
// Exits 1 when any link is broken so the monthly workflow flags it.
import { readFile, appendFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/data/transit.ts', import.meta.url), 'utf8');
const urls = [...new Set([...source.matchAll(/['"`](https?:\/\/[^'"`\s]+)['"`]/g)].map((m) => m[1]))];

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  accept: 'text/html,image/*,*/*;q=0.8',
};

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15000) });
      res.body?.cancel?.();
      if (res.ok) return { url, ok: true, status: res.status, redirected: res.redirected ? res.url : null };
      // Many sites reject HEAD; retry once with GET before calling it broken.
      if (method === 'GET' || ![403, 405, 501].includes(res.status)) return { url, ok: res.status === 403, status: res.status, note: res.status === 403 ? 'blocked bots, check by hand' : '' };
    } catch (err) {
      if (method === 'GET') return { url, ok: false, status: 'ERR', note: err.cause?.code ?? err.name };
    }
  }
}

const results = [];
for (let i = 0; i < urls.length; i += 8) results.push(...(await Promise.all(urls.slice(i, i + 8).map(check))));

const broken = results.filter((r) => !r.ok);
const flagged = results.filter((r) => r.ok && r.note);
const lines = [
  `# Venue link audit`,
  `Checked ${results.length} links: ${results.length - broken.length} OK, ${broken.length} broken, ${flagged.length} need a manual look.`,
  ...broken.map((r) => `- BROKEN (${r.status}${r.note ? ` ${r.note}` : ''}): ${r.url}`),
  ...flagged.map((r) => `- CHECK (${r.status} ${r.note}): ${r.url}`),
];
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
process.exit(broken.length ? 1 : 0);
