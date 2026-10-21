// Server-only secret resolution.
// Secrets are read from the deployment environment first and never from
// import.meta.env, so they can never be inlined into the browser bundle.

export type ServerEnvContext = {
  cloudflare?: { env?: Record<string, string | undefined> };
};

function fromProcess(name: string): string | undefined {
  const value = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  return value && value.length > 0 ? value : undefined;
}

function fromContext(context: unknown, name: string): string | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const env = (context as { cloudflare?: { env?: Record<string, unknown> } }).cloudflare?.env;
  const value = env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

// Node-only fallback so local development can keep secrets in a gitignored
// .env.local file instead of the tracked .env.
let localEnvCache: Record<string, string> | null = null;

async function fromLocalFile(): Promise<Record<string, string>> {
  if (localEnvCache) return localEnvCache;
  localEnvCache = {};
  try {
    const fs = await import('node:fs/promises');
    const raw = await fs.readFile('.env.local', 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      localEnvCache[key] = value;
    }
  } catch {
    // No .env.local, or no filesystem (edge runtime).
  }
  return localEnvCache;
}

/** Reads a server secret. Returns undefined when it is not configured. */
export async function readServerSecret(
  name: string,
  context?: unknown,
): Promise<string | undefined> {
  return fromProcess(name) ?? fromContext(context, name) ?? (await fromLocalFile())[name];
}
