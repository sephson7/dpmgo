import { describe, expect, it } from 'vitest';
import { mapHudArrival, mapHudStops } from './mapHud';
import { allTransitStations } from './transit';

describe('map HUD arrival honesty', () => {
  it('anchors Campus Martius to its actual QLINE stop, not a fictional DPM platform', () => {
    const stop = mapHudStops.find((item) => item.label === 'Campus Martius');
    expect(stop?.stationId).toBe('ql-campus-martius');
    expect(allTransitStations.find((item) => item.id === stop?.stationId)?.line).toBe('qline');
  });
  it('anchors Woodward & Fort to Congress Street boarding', () => {
    expect(mapHudStops.find((item) => item.label === 'Woodward & Fort')?.stationId).toBe('ql-congress');
  });
  it('does not present overnight scheduled departures as current arrivals', () => {
    const closed = new Date('2026-10-30T09:00:00Z');
    for (const stop of mapHudStops) expect(mapHudArrival(stop.stationId, closed)).toBeNull();
  });
});