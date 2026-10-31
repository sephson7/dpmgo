// Server-only persistence for anonymous station and sponsor counters, in the
// Lovable Cloud database. One row per event (no read-modify-write, so
// simultaneous events never collapse), summed per month by a server-only
// function. Returns null when the database is not configured (tests, local
// runs without credentials) so callers fall back to memory.

export type AnalyticsKind = 'drawer_open' | 'slot_view' | 'slot_map' | 'slot_visit';
export type MonthlyRow = {
  month: string;
  kind: AnalyticsKind;
  station_id: string;
  slot: number | null;
  total: number;
};

function configured(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env['VITEST']) return false;
  return Boolean(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
}

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

/** Stores one event. Returns false when the database is unavailable. */
export async function insertEvent(
  kind: AnalyticsKind,
  stationId: string,
  slot: 1 | 2 | null,
  month: string,
): Promise<boolean> {
  if (!configured()) return false;
  const db = await admin();
  const { error } = await db
    .from('analytics_events')
    .insert({ kind, station_id: stationId, slot, month });
  if (error) throw new Error(error.message);
  return true;
}

/** Monthly totals, or null when the database is unavailable. */
export async function monthlyTotals(): Promise<MonthlyRow[] | null> {
  if (!configured()) return null;
  const db = await admin();
  const { data, error } = await db.rpc('analytics_monthly');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, total: Number(r.total) })) as MonthlyRow[];
}
