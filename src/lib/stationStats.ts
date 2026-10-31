// Station drawer traffic: how many rider sessions opened each station drawer
// per Detroit calendar month. Stored in the Lovable Cloud database, with an
// in-memory fallback when the database is not configured.

import { insertEvent, monthlyTotals } from './analyticsDb';
import { statsMonth } from './slotStats';

export type StationOpens = { stationId: string; month: string; opens: number };

const memory = new Map<string, StationOpens>();

export async function recordDrawerOpen(stationId: string, _context?: unknown): Promise<void> {
  const month = statsMonth();
  if (await insertEvent('drawer_open', stationId, null, month)) return;
  const id = `${stationId}:${month}`;
  const cur = memory.get(id) ?? { stationId, month, opens: 0 };
  memory.set(id, { ...cur, opens: cur.opens + 1 });
}

/** Every record, newest month first, busiest station first within a month. */
export async function listDrawerOpens(_context?: unknown): Promise<StationOpens[]> {
  const rows = await monthlyTotals();
  const records: StationOpens[] = rows
    ? rows
        .filter((r) => r.kind === 'drawer_open')
        .map((r) => ({ stationId: r.station_id, month: r.month, opens: r.total }))
    : [...memory.values()];
  return records.sort((a, b) => b.month.localeCompare(a.month) || b.opens - a.opens);
}
