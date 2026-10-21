import { describe, expect, it } from 'vitest';
import {
  QLINE_HOURS,
  qlineServiceRunning,
  qlineServiceWindow,
  qlineStationSchedule,
  qlineStatus,
  qlineTripsAt,
} from './qlineSchedule';

/** A Detroit local time on a given date. */
const detroit = (date: string, hour: number, minute = 0) => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  // Detroit is UTC-4 in the summer and UTC-5 in the winter. These tests only
  // care about the local clock, so the summer offset is used throughout.
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
};

describe('QLINE operating hours', () => {
  it('runs the agency timetable once the feed calendar has expired', () => {
    // 2026-10-21 is a Wednesday. The feed calendar ends 2025-12-31, so the
    // published daily pattern is rolled forward and the line runs from its
    // first departure to the last arrival of the day.
    expect(qlineServiceRunning(detroit('2026-10-21', 7, 29))).toBe(false);
    expect(qlineServiceRunning(detroit('2026-10-21', 7, 30))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-21', 12, 0))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-21', 23, 30))).toBe(true);
  });

  it('is closed between the last arrival and the first departure', () => {
    expect(qlineServiceRunning(detroit('2026-10-21', 0, 30))).toBe(false);
    expect(qlineServiceRunning(detroit('2026-10-21', 3, 0))).toBe(false);
  });

  it('keeps the late run of the previous service day', () => {
    // The Monday service runs past midnight into Tuesday, and the Sunday
    // service does not, so the tail belongs to the night it was scheduled on.
    expect(qlineServiceRunning(detroit('2026-10-20', 0, 10))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-19', 0, 10))).toBe(false);
  });

  it('closes earlier on a Sunday', () => {
    // 2026-10-25 is a Sunday.
    expect(qlineServiceRunning(detroit('2026-10-25', 8, 0))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-25', 20, 30))).toBe(true);
    expect(qlineServiceRunning(detroit('2026-10-25', 21, 30))).toBe(false);
  });

  it('reports the service window of the agency timetable', () => {
    const window = qlineServiceWindow(detroit('2026-10-21', 12, 0));
    expect(window.source).toBe('pattern');
    expect(window.opensAt).toBe('7:30 AM');
    expect(window.closesAt).toBe('12:20 AM');

    const sunday = qlineServiceWindow(detroit('2026-10-25', 12, 0));
    expect(sunday.opensAt).toBe('7:30 AM');
    expect(sunday.closesAt).toBe('9:20 PM');
  });

  it('falls back to the published hours when the agency has no timetable', () => {
    // 2025-04-04 is before the feed calendar starts, so there is no agency
    // schedule to read and the published operating hours stand in for it.
    const window = qlineServiceWindow(detroit('2025-04-04', 12, 0));
    expect(window.source).toBe('published');
    expect(window.opensAt).toBe('8:00 AM');
    expect(window.closesAt).toBe('12:00 AM');
    expect(window.startMinutes).toBe(QLINE_HOURS.weekday.startMinutes);
  });

  it('reports the next departure while the line is running', () => {
    const closed = qlineStatus(detroit('2026-10-21', 6, 0));
    expect(closed.running).toBe(false);
    expect(closed.label).toBe('CLOSED');

    const open = qlineStatus(detroit('2026-10-21', 12, 2));
    expect(open.running).toBe(true);
    expect(open.label).toBe('EVERY 6–9 MIN');
    expect(open.minutesToNext).not.toBeNull();
    expect(open.minutesToNext).toBeGreaterThan(0);
    expect(open.minutesToNext).toBeLessThanOrEqual(15);
  });
});

describe('QLINE timetable', () => {
  it('lists the scheduled departures for the date', () => {
    const departures = qlineStationSchedule('ql-congress', detroit('2026-10-21', 12, 0));
    expect(departures.length).toBe(4);
    expect(departures[0]!.time).toBe('12:00 PM');
    expect(departures[0]!.label).toBe('TO GRAND BLVD');
  });

  it('draws the vehicle where the timetable says it is', () => {
    const { trips, source } = qlineTripsAt(detroit('2026-10-21', 12, 0));
    expect(source).toBe('pattern');
    expect(trips.length).toBeGreaterThan(0);
  });

  it('agrees with the vehicle on the map for the whole day', () => {
    for (const date of ['2026-10-19', '2026-10-21', '2026-10-25']) {
      for (let minute = 0; minute < 24 * 60; minute += 1) {
        const at = detroit(date, 0, minute);
        expect(qlineServiceRunning(at)).toBe(qlineTripsAt(at).trips.length > 0);
      }
    }
  });
});
