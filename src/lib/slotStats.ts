// Sponsor slot reach: how many riders saw a partner card, tapped it on the
// map, or opened the partner's website. One counter record per station, slot
// and month, kept in the same KV namespace as the portal records (with the
// same local fallback), so a partner can be shown a monthly report.
//
// KV has no atomic increment, so two simultaneous events in different
// isolates can occasionally collapse into one. The numbers are a floor, and
// the portal labels them as approximate.

export type SlotEvent = 'view' | 'map' | 'visit';

export type SlotStats = {
  stationId: string;
  slot: 1 | 2;
  /** The calendar month, YYYY-MM, in Detroit time. */
  month: string;
  views: number;
  mapTaps: number;
  visits: number;
};

const PREFIX = 'anchor:stats:';
const FIELD: Record<SlotEvent, 'views' | 'mapTaps' | 'visits'> = {
  view: 'views',
  map: 'mapTaps',
  visit: 'visits',
};

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
  const binding = env?.['ANCHOR_STORE'] as Partial<KV> | undefined;
  if (!binding || typeof binding.get !== 'function' || typeof binding.put !== 'function')
    return null;
  if (typeof binding.list !== 'function') return null;
  return binding as KV;
}

/** The current month in Detroit time, YYYY-MM. */
export function statsMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Detroit',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '00';
  return `${year}-${month}`;
}

function empty(stationId: string, slot: 1 | 2, month: string): SlotStats {
  return { stationId, slot, month, views: 0, mapTaps: 0, visits: 0 };
}

/** Applies one event to a record. Pure, so it can be tested. */
export function applySlotEvent(stats: SlotStats, event: SlotEvent): SlotStats {
  const field = FIELD[event];
  return { ...stats, [field]: stats[field] + 1 };
}

const memory = new Map<string, SlotStats>();

export async function recordSlotEvent(
  stationId: string,
  slot: 1 | 2,
  event: SlotEvent,
  context?: unknown,
): Promise<void> {
  const month = statsMonth();
  const id = `${stationId}:${slot}:${month}`;
  const store = kv(context);
  if (!store) {
    memory.set(id, applySlotEvent(memory.get(id) ?? empty(stationId, slot, month), event));
    return;
  }
  const raw = await store.get(`${PREFIX}${id}`, 'text');
  const current = raw ? (JSON.parse(raw) as SlotStats) : empty(stationId, slot, month);
  await store.put(`${PREFIX}${id}`, JSON.stringify(applySlotEvent(current, event)));
}

/** Every counter record, newest month first. */
export async function listSlotStats(context?: unknown): Promise<SlotStats[]> {
  const store = kv(context);
  let records: SlotStats[];
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
    const values = await Promise.all(names.map((name) => store.get(name, 'text')));
    records = values.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v));
  }
  return records.sort((a, b) => b.month.localeCompare(a.month));
}
