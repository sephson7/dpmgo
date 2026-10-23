// Devices that have signed in to the partner portal stop counting toward
// sponsor reach and station traffic, so the owner's own testing never
// inflates the numbers shown to partners.

const KEY = 'dpmgo_exclude_analytics';

export function isAnalyticsExcluded(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAnalyticsExcluded(excluded: boolean): void {
  try {
    if (excluded) localStorage.setItem(KEY, 'true');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: nothing to persist.
  }
}

/** Posts a small JSON event without blocking navigation. */
export function sendEvent(url: string, payload: unknown): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // Fall through to fetch.
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Counts a station drawer opening once per station per tab session. */
export function trackDrawerOpen(stationId: string): void {
  if (isAnalyticsExcluded()) return;
  const key = `dpm-drawer-open:${stationId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Private mode: count it anyway.
  }
  sendEvent('/api/station-open', { stationId });
}
