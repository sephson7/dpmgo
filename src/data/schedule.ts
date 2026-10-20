import raw from './dpmSchedule.json';
import { detroitMidnightMs, detroitNow, shiftDate, weekdayInDetroit } from './detroitTime';

// Generated from the Detroit Transportation Corporation's official GTFS feed:
// https://hosted-gtfs-feeds.s3.amazonaws.com/DPM/gtfs.zip — scheduled times, not live arrivals.
type Schedule = { calendar: { id: string; days: number[]; start: string; end: string }[]; exceptions: { id: string; date: string; type: number }[]; departures: Record<string, Record<string, number[]>> };
const schedule = raw as Schedule;
const regular = new Set(['weekday', 'saturday', 'sunday']);

export function servicesOn(ymd: string) {
  const active = new Set(schedule.calendar.filter(c => c.start <= ymd && c.end >= ymd && c.days.includes(weekdayInDetroit(ymd))).map(c => c.id));
  for (const e of schedule.exceptions) if (e.date === ymd) { if (e.type === 1) active.add(e.id); else active.delete(e.id); }
  return [...active];
}

// System-wide windows, including special calendars and yesterday's trips after midnight.
const serviceWindows = Object.fromEntries(Object.entries(schedule.departures).map(([id, stops]) => {
  const times = Object.values(stops).flat();
  return [id, times.length ? { start: Math.floor(Math.min(...times) / 60) * 60, end: Math.max(...times) + 1 } : null];
}));

export function peopleMoverServiceRunning(now = new Date()): boolean {
  return peopleMoverServiceWindow(now) !== null;
}

/**
 * The service window that contains `now`, as epoch milliseconds. Yesterday's
 * calendar is included because its trips can run past midnight.
 */
export function peopleMoverServiceWindow(now = new Date()): { start: number; end: number } | null {
  const { ymd, seconds } = detroitNow(now);
  for (const offset of [-1, 0]) {
    const day = shiftDate(ymd, offset);
    const time = seconds - offset * 86400;
    for (const id of servicesOn(day)) {
      const window = serviceWindows[id];
      if (!window) continue;
      if (time >= window.start && time < window.end) {
        const midnight = detroitMidnightMs(day);
        return { start: midnight + window.start * 1000, end: midnight + window.end * 1000 };
      }
    }
  }
  return null;
}

const fmt = (ymd: string, seconds: number) => {
  const h = Math.floor(seconds / 3600) % 24, m = Math.floor(seconds / 60) % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const label = (ymd: string) => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8), 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

export type NextTrain = { time: string; minutes: number; day: string | null };
export type StationSchedule = {
  /** True while the line is running on the selected date. */
  running: boolean;
  /** The next published departures at the station. */
  trains: NextTrain[];
  /** True when a special event calendar replaces the regular one today. */
  specialToday: boolean;
  /** Labels of the upcoming special event days. */
  specialDays: string[];
};
export function stationSchedule(stationId: string, now = new Date()): StationSchedule {
  const { ymd, seconds } = detroitNow(now);
  const trains: NextTrain[] = [];
  let running = false;
  // Yesterday's service can run past midnight (GTFS times above 24:00).
  for (const offset of [-1, 0, 1, 2]) {
    const day = shiftDate(ymd, offset);
    const nowInDay = seconds - offset * 86400;
    for (const id of servicesOn(day)) {
      const times = schedule.departures[id]?.[stationId] ?? [];
      if (times.length && nowInDay >= (times[0] ?? 0) - 60 && nowInDay <= (times[times.length - 1] ?? 0)) running = true;
      for (const t of times) if (t >= nowInDay) trains.push({ time: fmt(day, t), minutes: Math.round((t - nowInDay) / 60), day: t - nowInDay > 3600 * 6 || offset > 0 && t < 86400 ? label(day) : null });
    }
    if (trains.length >= 4) break;
  }
  trains.sort((a, b) => a.minutes - b.minutes);
  const specialToday = servicesOn(ymd).some(id => !regular.has(id));
  const specialDays = [...new Set(schedule.exceptions.filter(e => e.type === 1 && e.date >= ymd).map(e => e.date))].sort().map(label);
  return { running, trains: trains.slice(0, 4), specialToday, specialDays };
}
