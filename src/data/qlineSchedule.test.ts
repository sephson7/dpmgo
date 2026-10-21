import { describe, expect, it } from 'vitest';
import { QLINE_HOURS, qlineServiceRunning, qlineServiceWindow, qlineStatus } from './qlineSchedule';
import { QLINE_CYCLE_MS, simulatedQlineTrain } from './qlineSimulation';

/** A Detroit local time on a given date. */
const detroit = (date: string, hour: number, minute = 0) => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  // Detroit is UTC-4 in the summer and UTC-5 in the winter. These tests only
  // care about the local clock, so the summer offset is used throughout.
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
};

describe('QLINE operating hours', () => {
  it('runs on the published weekday hours', () => {
    // 2026-10-21 is a Wednesday.
    expect(qlineServiceRunning(detroit('2026-10-21', 7, 59))).toBe(false);
    expect(qlineServiceRunning(detroit('2026-10-21', 8, 0))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-21', 12, 0))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-21', 23, 30))).toBe(true);
  });

  it('is closed after midnight', () => {
    expect(qlineServiceRunning(detroit('2026-10-21', 0, 30))).toBe(false);
    expect(qlineServiceRunning(detroit('2026-10-21', 3, 0))).toBe(false);
  });

  it('closes earlier on a Sunday', () => {
    // 2026-10-25 is a Sunday.
    expect(qlineServiceRunning(detroit('2026-10-25', 8, 0))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-25', 20, 30))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-25', 21, 0))).toBe(false);
  });

  it('falls back to the published hours when the feed has no service', () => {
    // The bundled feed calendar ends 2025-12-31, so every date in 2026 is
    // served by the published hours rather than the agency calendar.
    const window = qlineServiceWindow(detroit('2026-10-21', 12, 0));
    expect(window.fromFeed).toBe(false);
    expect(window.opensAt).toBe('8:00 AM');
    expect(window.closesAt).toBe('12:00 AM');
    expect(window.startMinutes).toBe(QLINE_HOURS.weekday.startMinutes);
  });

  it('reports the next departure while the line is running', () => {
    const closed = qlineStatus(detroit('2026-10-21', 6, 0));
    expect(closed.running).toBe(false);
    expect(closed.label).toBe('CLOSED');

    const open = qlineStatus(detroit('2026-10-21', 12, 0));
    expect(open.running).toBe(true);
    expect(open.minutesToNext).not.toBeNull();
    expect(open.minutesToNext).toBeGreaterThan(0);
    expect(open.minutesToNext).toBeLessThanOrEqual(15);
  });
});

describe('QLINE streetcar simulation', () => {
  it('moves the vehicle while the line is in service', () => {
    const before = simulatedQlineTrain(0).coordinate;
    const after = simulatedQlineTrain(60_000).coordinate;
    const moved = Math.hypot(after[0] - before[0], after[1] - before[1]);
    expect(moved).toBeGreaterThan(0.0001);
  });

  it('runs a corridor cycle of a realistic length', () => {
    expect(QLINE_CYCLE_MS / 60000).toBeGreaterThan(20);
    expect(QLINE_CYCLE_MS / 60000).toBeLessThan(90);
  });
});
