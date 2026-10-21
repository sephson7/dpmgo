import raw from './qlineSchedule.json';
import { detroitNow, formatClockMinutes, shiftDate, weekdayInDetroit } from './detroitTime';

/**
 * QLINE schedule data generated from the official GTFS feed.
 * https://data.trilliumtransit.com/gtfs/qline-mi-us/qline-mi-us.zip
 *
 * The feed is the authority for scheduled departures. When the bundled feed
 * has no service for a given date (its calendar is finite), the app falls
 * back to the published operating hours instead of showing stale times.
 */
type FeedSegment = { direction: number; from: string; to: string; seconds: number };

type Feed = {
  source: string;
  generatedAt: string;
  calendar: { id: string; days: number[]; start: string; end: string }[];
  exceptions: { id: string; date: string; type: number }[];
  departures: Record<string, Record<string, number[]>>;
  directions: Record<string, Record<string, number[]>>;
  segments: FeedSegment[];
  headwayMinutes: Record<string, { min: number; max: number; median: number }>;
};

const feed = raw as Feed;

/**
 * Published operating hours, used when the feed has no service for the date.
 * https://www.qlinedetroit.com/ — Monday–Saturday 8:00 AM to 12:00 AM,
 * Sunday 8:00 AM to 9:00 PM. Service is free.
 */
export const QLINE_HOURS = {
  weekday: { startMinutes: 8 * 60, endMinutes: 24 * 60 },
  sunday: { startMinutes: 8 * 60, endMinutes: 21 * 60 },
} as const;

/** The published headway is "every 15 minutes or less". */
export const QLINE_HEADWAY_MINUTES = 15;

export const QLINE_FEED_SOURCE = feed.source;
export const QLINE_FEED_GENERATED_AT = feed.generatedAt;

export type QlineWindow = {
  startMinutes: number;
  endMinutes: number;
  isSunday: boolean;
  opensAt: string;
  closesAt: string;
  /** True when the numbers come from the GTFS feed rather than the published hours. */
  fromFeed: boolean;
};

function servicesOn(ymd: string): string[] {
  const active = new Set(
    feed.calendar
      .filter(
        (entry) =>
          entry.start <= ymd && entry.end >= ymd && entry.days.includes(weekdayInDetroit(ymd)),
      )
      .map((entry) => entry.id),
  );
  for (const exception of feed.exceptions) {
    if (exception.date !== ymd) continue;
    if (exception.type === 1) active.add(exception.id);
    else active.delete(exception.id);
  }
  return [...active];
}

/** Scheduled seconds for a service, across every station. */
function serviceSeconds(serviceIds: string[]): number[] {
  const seconds: number[] = [];
  for (const serviceId of serviceIds) {
    const stops = feed.departures[serviceId];
    if (!stops) continue;
    for (const times of Object.values(stops)) seconds.push(...times);
  }
  return seconds;
}

/** True when the bundled feed has scheduled service on the given date. */
export function qlineFeedCoversDate(now = new Date()): boolean {
  const { ymd } = detroitNow(now);
  return servicesOn(ymd).length > 0;
}

export function qlineServiceWindow(now = new Date()): QlineWindow {
  const { ymd, seconds, weekday } = detroitNow(now);
  const isSunday = weekday === 6;
  const services = servicesOn(ymd);
  const scheduled = serviceSeconds(services);

  if (scheduled.length > 0) {
    const start = Math.min(...scheduled);
    const end = Math.max(...scheduled);
    return {
      startMinutes: start / 60,
      endMinutes: end / 60,
      isSunday,
      opensAt: formatClockMinutes(start / 60),
      closesAt: formatClockMinutes(end / 60),
      fromFeed: true,
    };
  }

  const hours = isSunday ? QLINE_HOURS.sunday : QLINE_HOURS.weekday;
  return {
    startMinutes: hours.startMinutes,
    endMinutes: hours.endMinutes,
    isSunday,
    opensAt: formatClockMinutes(hours.startMinutes),
    closesAt: formatClockMinutes(hours.endMinutes),
    fromFeed: false,
  };
}

/** True while the streetcar is running, using Detroit local time. */
export function qlineServiceRunning(now = new Date()): boolean {
  const { ymd, seconds } = detroitNow(now);
  // Yesterday's service can run past midnight.
  for (const offset of [-1, 0]) {
    const day = shiftDate(ymd, offset);
    const services = servicesOn(day);
    if (services.length === 0) continue;
    const scheduled = serviceSeconds(services);
    if (scheduled.length === 0) continue;
    const start = Math.min(...scheduled);
    const end = Math.max(...scheduled);
    const time = seconds - offset * 86400;
    if (time >= start && time < end) return true;
  }
  return false;
}

/** Scheduled headway for the active service, from the feed. */
function feedHeadway(now = new Date()): { min: number; max: number; median: number } | null {
  const { ymd } = detroitNow(now);
  for (const serviceId of servicesOn(ymd)) {
    const headway = feed.headwayMinutes[serviceId];
    if (headway) return headway;
  }
  return null;
}

export type QlineStatus = {
  running: boolean;
  /** Minutes until the next departure, or null when the line is closed. */
  minutesToNext: number | null;
  /** "EVERY 6–9 MIN" from the feed, or the published headway. */
  label: string;
  window: QlineWindow;
  nextDepartureLabel: string;
};

/**
 * Live status for the QLINE. Arrivals come from the scheduled departures
 * when the feed covers the date, and from the published headway otherwise.
 */
export function qlineStatus(now = new Date()): QlineStatus {
  const { seconds } = detroitNow(now);
  const window = qlineServiceWindow(now);
  const minutes = seconds / 60;
  const headway = feedHeadway(now);

  if (minutes < window.startMinutes) {
    return {
      running: false,
      minutesToNext: Math.ceil(window.startMinutes - minutes),
      label: 'CLOSED',
      window,
      nextDepartureLabel: `OPENS ${window.opensAt}`,
    };
  }
  if (minutes >= window.endMinutes) {
    const untilOpen = 24 * 60 - minutes + window.startMinutes;
    return {
      running: false,
      minutesToNext: Math.ceil(untilOpen),
      label: 'CLOSED',
      window,
      nextDepartureLabel: `OPENS ${window.opensAt}`,
    };
  }

  if (headway) {
    const next = nextScheduledDeparture('ql-congress', now);
    const minutesToNext = next ? Math.max(0, Math.ceil(next.minutes)) : null;
    return {
      running: true,
      minutesToNext,
      label: `EVERY ${headway.min}–${headway.max} MIN`,
      window,
      nextDepartureLabel:
        minutesToNext === null
          ? 'IN SERVICE'
          : minutesToNext <= 1
            ? 'DUE NOW'
            : `IN ~${minutesToNext} MIN`,
    };
  }

  const elapsed = minutes - window.startMinutes;
  const into = elapsed % QLINE_HEADWAY_MINUTES;
  const minutesToNext = Math.ceil(QLINE_HEADWAY_MINUTES - into);
  return {
    running: true,
    minutesToNext,
    label: `EVERY ${QLINE_HEADWAY_MINUTES} MIN`,
    window,
    nextDepartureLabel: minutesToNext <= 1 ? 'DUE NOW' : `IN ~${minutesToNext} MIN`,
  };
}

export type QlineDeparture = {
  /** Seconds since midnight of the scheduled day. */
  seconds: number;
  time: string;
  minutes: number;
  direction: 'northbound' | 'southbound';
  label: string;
};

/**
 * The next scheduled departures at a station. Returns an empty list when the
 * bundled feed has no service for the date.
 */
export function qlineStationSchedule(stationId: string, now = new Date()): QlineDeparture[] {
  const { ymd, seconds } = detroitNow(now);
  const services = servicesOn(ymd);
  if (services.length === 0) return [];

  const entries: { seconds: number; direction: number }[] = [];
  for (const serviceId of services) {
    const times = feed.departures[serviceId]?.[stationId];
    const directions = feed.directions[serviceId]?.[stationId];
    if (!times) continue;
    times.forEach((value, index) => {
      if (value >= seconds - 60)
        entries.push({ seconds: value, direction: directions?.[index] ?? 0 });
    });
  }
  entries.sort((a, b) => a.seconds - b.seconds);

  return entries.slice(0, 4).map((entry) => ({
    seconds: entry.seconds,
    time: formatClockMinutes(entry.seconds / 60),
    minutes: Math.round((entry.seconds - seconds) / 60),
    direction: entry.direction === 1 ? 'northbound' : 'southbound',
    label: entry.direction === 1 ? 'TO GRAND BLVD' : 'TO CONGRESS ST',
  }));
}

function nextScheduledDeparture(stationId: string, now = new Date()): { minutes: number } | null {
  const upcoming = qlineStationSchedule(stationId, now);
  if (upcoming.length === 0) return null;
  return { minutes: upcoming[0]!.minutes };
}

/** Scheduled run time between two stations, in seconds. */
export function qlineSegmentSeconds(direction: number, from: string, to: string): number | null {
  const segment = feed.segments.find(
    (entry) => entry.direction === direction && entry.from === from && entry.to === to,
  );
  return segment ? segment.seconds : null;
}
