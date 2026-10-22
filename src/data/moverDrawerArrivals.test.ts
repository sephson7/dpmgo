import { describe, expect, it } from 'vitest';
import { moverDrawerArrivals } from './moverDrawerArrivals';
import { getNextTrainForStation, moverFleetElapsed } from './trainSimulation';
import { peopleMoverStations } from './transit';

describe('People Mover drawer arrivals', () => {
  const now = new Date('2026-10-22T17:04:00Z');

  it('shows exactly two entries during normal service at every station', () => {
    for (const station of peopleMoverStations) {
      expect(moverDrawerArrivals(station.id, now)).toHaveLength(2);
    }
  });

  it('keeps the first estimate synchronized with the simulated fleet', () => {
    for (const station of peopleMoverStations) {
      const next = getNextTrainForStation(station.id, moverFleetElapsed(now.getTime()));
      expect(moverDrawerArrivals(station.id, now)[0]?.minutes).toBe(
        Math.ceil(next.totalSeconds / 60),
      );
      expect(moverDrawerArrivals(station.id, now)[0]?.source).toBe('simulation');
    }
  });

  it('shows a 15–20 minute second planning window rather than a 25 minute prediction', () => {
    for (let minute = 0; minute < 60; minute += 1) {
      const second = moverDrawerArrivals('bricktown', new Date(now.getTime() + minute * 60000))[1];
      expect(second).toEqual({
        time: '15–20 MIN',
        minutes: 15,
        note: 'Planning window · Not live',
        source: 'planning',
      });
    }
  });

  it('does not show simulations or planning windows outside service hours', () => {
    const closed = moverDrawerArrivals('bricktown', new Date('2026-10-22T08:00:00Z'));
    expect(closed.length).toBeGreaterThan(0);
    expect(closed.length).toBeLessThanOrEqual(2);
    expect(closed.every((arrival) => arrival.source === 'schedule')).toBe(true);
  });

  it('omits the second window near service close', () => {
    const closing = moverDrawerArrivals('bricktown', new Date('2026-10-23T03:55:00Z'));
    expect(closing.some((arrival) => arrival.source === 'planning')).toBe(false);
  });

  it('does not invent service after the agency calendar expires', () => {
    expect(moverDrawerArrivals('bricktown', new Date('2027-01-02T17:00:00Z'))).toEqual([]);
  });
});
