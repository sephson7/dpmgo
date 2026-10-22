import { describe, expect, it } from 'vitest';
import { applySlotEvent, listSlotStats, recordSlotEvent, statsMonth } from './slotStats';

describe('sponsor slot reach', () => {
  it('counts each event type in its own column', () => {
    const base = {
      stationId: 'times-square',
      slot: 1 as const,
      month: '2026-10',
      views: 0,
      mapTaps: 0,
      visits: 0,
    };
    const after = applySlotEvent(applySlotEvent(applySlotEvent(base, 'view'), 'map'), 'visit');
    expect(after).toMatchObject({ views: 1, mapTaps: 1, visits: 1 });
  });

  it('groups counts by Detroit calendar month', () => {
    // 2026-11-01 02:00 UTC is still October 31 in Detroit.
    expect(statsMonth(new Date('2026-11-01T02:00:00Z'))).toBe('2026-10');
  });

  it('keeps stations and slots apart', async () => {
    await recordSlotEvent('broadway', 1, 'view');
    await recordSlotEvent('broadway', 1, 'view');
    await recordSlotEvent('broadway', 2, 'visit');
    const rows = await listSlotStats();
    expect(rows.find((r) => r.stationId === 'broadway' && r.slot === 1)?.views).toBe(2);
    expect(rows.find((r) => r.stationId === 'broadway' && r.slot === 2)?.visits).toBe(1);
  });
});
