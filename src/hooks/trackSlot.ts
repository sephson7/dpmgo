// Sends a sponsor slot reach event. A view counts once per station and slot
// per browser tab session, so reopening the same drawer is not double counted.

type SlotEvent = 'view' | 'map' | 'visit';

export function trackSlot(stationId: string, slot: 1 | 2, event: SlotEvent): void {
  if (typeof window === 'undefined') return;
  if (event === 'view') {
    const key = `dpm-slot-view:${stationId}:${slot}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Private mode: count it anyway.
    }
  }
  const body = JSON.stringify({ stationId, slot, event });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/slot-event', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // Fall through to fetch.
  }
  void fetch('/api/slot-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
