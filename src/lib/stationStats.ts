// Station drawer traffic: how many rider sessions opened each station drawer
// per Detroit calendar month. Same KV namespace and local fallback as the
// sponsor counters; KV has no atomic increment, so counts are a floor.

import { statsMonth } from './slotStats';

export type StationOpens = { stationId: string; month: string; opens: number };

const PREFIX = 'anchor:drawer:';

type KV = {
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string | undefined }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
};

function kv(context?: unknown): KV | null {
  const env = (context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)
    ?.cloudflare?.env;
  const b = env?.['ANCHOR_STORE'] as Partial<KV> | undefined;
  if (!b || typeof b.get !== 'function' || typeof b.put !== 'function') return null;
  if (typeof b.list !== 'function') return null;
  return b as KV;
}

const memory = new Map<string, StationOpens>();

export async function recordDrawerOpen(stationId: string, context?: unknown): Promise<void> {
  const month = statsMonth();
  const id = `${stationId}:${month}`;
  const store = kv(context);
  if (!store) {
    const cur = memory.get(id) ?? { stationId, month, opens: 0 };
    memory.set(id, { ...cur, opens: cur.opens + 1 });
    return;
  }
  const raw = await store.get(`${PREFIX}${id}`, 'text');
  const cur: StationOpens = raw ? JSON.parse(raw) : { stationId, month, opens: 0 };
  await store.put(`${PREFIX}${id}`, JSON.stringify({ ...cur, opens: cur.opens + 1 }));
}

/** Every record, newest month first, busiest station first within a month. */
export async function listDrawerOpens(context?: unknown): Promise<StationOpens[]> {
  const store = kv(context);
  let records: StationOpens[];
  if (!store) {
    records = [...memory.values()];
  } else {
    const names: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await store.list({ prefix: PREFIX, cursor });
      for (const key of page.keys) names.push(key.name);
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    const values = await Promise.all(names.map((n) => store.get(n, 'text')));
    records = values.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v));
  }
  return records.sort((a, b) => b.month.localeCompare(a.month) || b.opens - a.opens);
}
