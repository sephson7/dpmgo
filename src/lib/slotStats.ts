// Sponsor slot reach: how many riders saw a partner card, tapped it on the
// map, or opened the partner's website. One counter record per station, slot
// and month, stored as event rows in the Lovable Cloud database (with
// an in-memory fallback), so a partner can be shown a monthly report.
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

const KIND = { view: 'slot_view', map: 'slot_map', visit: 'slot_visit' } as const;

export async function recordSlotEvent(
  stationId: string,
  slot: 1 | 2,
  event: SlotEvent,
  _context?: unknown,
): Promise<void> {
  const month = statsMonth();
  const { insertEvent } = await import('./analyticsDb');
  if (await insertEvent(KIND[event], stationId, slot, month)) return;
  const id = `${stationId}:${slot}:${month}`;
  memory.set(id, applySlotEvent(memory.get(id) ?? empty(stationId, slot, month), event));
}

/** Every counter record, newest month first. */
export async function listSlotStats(_context?: unknown): Promise<SlotStats[]> {
  const { monthlyTotals } = await import('./analyticsDb');
  const rows = await monthlyTotals();
  let records: SlotStats[];
  if (!rows) {
    records = [...memory.values()];
  } else {
    const byId = new Map<string, SlotStats>();
    for (const r of rows) {
      if (r.kind === 'drawer_open' || (r.slot !== 1 && r.slot !== 2)) continue;
      const id = `${r.station_id}:${r.slot}:${r.month}`;
      const cur = byId.get(id) ?? empty(r.station_id, r.slot, r.month);
      const field = r.kind === 'slot_view' ? 'views' : r.kind === 'slot_map' ? 'mapTaps' : 'visits';
      byId.set(id, { ...cur, [field]: cur[field] + r.total });
    }
    records = [...byId.values()];
  }
  return records.sort((a, b) => b.month.localeCompare(a.month));
}
