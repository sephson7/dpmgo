// Sends a sponsor slot reach event. A view counts once per station and slot
// per browser tab session, so reopening the same drawer is not double counted.
// Admin devices are excluded entirely.

import { isAnalyticsExcluded, sendEvent } from './analyticsOptOut';

type SlotEvent = 'view' | 'map' | 'visit';

export function trackSlot(stationId: string, slot: 1 | 2, event: SlotEvent): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
  if (event === 'view') {
    const key = `dpm-slot-view:${stationId}:${slot}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Private mode: count it anyway.
    }
  }
  sendEvent('/api/slot-event', { stationId, slot, event });
}
