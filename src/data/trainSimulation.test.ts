import { describe, expect, it } from 'vitest';
import { peopleMoverServiceRunning } from './schedule';
import { MOVER_DWELL_MS, MOVER_HEADWAY_MS, MOVER_LOOP_MS, simulatedMoverPosition, simulatedMoverPositions, simulatedMoverTrain } from './trainSimulation';

describe('two-train simulation', () => {
  it('models a 14.5 minute loop and 7.25 minute headway', () => {
    expect(MOVER_LOOP_MS).toBe(870000);
    expect(MOVER_HEADWAY_MS).toBe(435000);
    const trains = simulatedMoverPositions(0);
    expect(trains).toHaveLength(2);
    expect(trains[0]).not.toEqual(trains[1]);
    expect(trains[1]).toEqual(simulatedMoverPosition(MOVER_HEADWAY_MS));
    expect(simulatedMoverPosition(MOVER_LOOP_MS)).toEqual(trains[0]);
  });
  it('dwells for 15 seconds then moves along the loop', () => {
    expect(simulatedMoverPosition(MOVER_DWELL_MS - 1)).toEqual(simulatedMoverPosition(0));
    expect(simulatedMoverPosition(MOVER_DWELL_MS + 1000)).not.toEqual(simulatedMoverPosition(0));
  });
  it('aligns train bearings with forward travel and keeps orientation while dwelling', () => {
    expect(simulatedMoverTrain(0).bearing).toBe(simulatedMoverTrain(MOVER_DWELL_MS - 1).bearing);
    for (let time = MOVER_DWELL_MS + 1000; time < MOVER_LOOP_MS; time += 1000) {
      const train = simulatedMoverTrain(time);
      const next = simulatedMoverPosition(time + 1);
      const dx = (next[0] - train.coordinate[0]) * Math.cos(train.coordinate[1] * Math.PI / 180);
      const dy = next[1] - train.coordinate[1];
      if (Math.hypot(dx, dy) < 1e-12) continue;
      const forward = Math.atan2(dx, dy) * 180 / Math.PI;
      expect(Math.abs(((train.bearing - forward + 540) % 360) - 180)).toBeLessThan(0.01);
    }
  });
});

describe('official service-hours gate (Detroit time)', () => {
  it('is off overnight and starts at the scheduled opening minute', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-07T04:09:00Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-07T09:59:59Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-07T10:00:00Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-08T04:00:00Z'))).toBe(false);
  });
  it('uses weekend hours and special-event replacement calendars', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-17T13:00:00Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-24T13:00:00Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-18T10:00:00Z'))).toBe(true);
  });
  it('continues previous-day special service until 2 AM', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-31T05:59:59Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-31T06:00:00Z'))).toBe(false);
  });
  it('does not imply operation beyond the bundled calendar', () => {
    expect(peopleMoverServiceRunning(new Date('2027-01-02T17:00:00Z'))).toBe(false);
  });
});