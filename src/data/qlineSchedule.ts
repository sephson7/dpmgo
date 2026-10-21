import raw from './qlineSchedule.json';
import { detroitNow, formatClockMinutes, shiftDate, weekdayInDetroit } from './detroitTime';
import { qlineStations } from './transit';

/**
 * QLINE schedule data generated from the official GTFS feed.
 * https://data.trilliumtransit.com/gtfs/qline-mi-us/qline-mi-us.zip
 *
 * The feed is the authority for scheduled departures. Its calendar is finite,
 * so once it has expired the published daily pattern for that weekday is
 * rolled forward, and every reader of the schedule follows that one timetable.
 */
type Feed = {
  source: string;
  generatedAt: string;
  calendar: { id: string; days: number[]; start: string; end: string }[];
  exceptions: { id: string; date: string; type: number }[];
  departures: Record<string, Record<string, number[]>>;
  directions: Record<string, Record<string, number[]>>;
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

/** Where the times for a date come from. */
export type QlineScheduleSource = 'feed' | 'pattern' | 'published';

export type QlineWindow = {
  startMinutes: number;
  endMinutes: number;
  isSunday: boolean;
  opensAt: string;
  closesAt: string;
  /** Whether the numbers come from the agency timetable or the published hours. */
  source: QlineScheduleSource;
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

/** The last date the bundled feed's calendar covers. */
const feedCalendarEnd = feed.calendar.reduce(
  (latest, entry) => (entry.end > latest ? entry.end : latest),
  '',
);

/**
 * The service that runs on a date. The feed's calendar is finite, so once it
 * has expired the published daily pattern for that weekday is rolled forward
 * and the agency timetable keeps driving the map, the drawer and the status
 * readout alike.
 */
function effectiveService(ymd: string): { ids: string[]; source: 'feed' | 'pattern' } | null {
  const dated = servicesOn(ymd);
  if (dated.length) return { ids: dated, source: 'feed' };
  if (ymd <= feedCalendarEnd) return null;
  const pattern = patternServiceFor(ymd);
  return pattern ? { ids: [pattern], source: 'pattern' } : null;
}

/**
 * The operating window of the line on a date. The agency timetable wins when
 * it has one, so the window always matches the vehicle drawn on the map.
 */
function windowFor(ymd: string): QlineWindow {
  const isSunday = weekdayInDetroit(ymd) === 6;
  const service = effectiveService(ymd);
  const scheduled = service ? serviceSeconds(service.ids) : [];

  if (service && scheduled.length > 0) {
    const start = Math.min(...scheduled);
    const end = Math.max(...scheduled);
    return {
      startMinutes: start / 60,
      endMinutes: end / 60,
      isSunday,
      opensAt: formatClockMinutes(start / 60),
      closesAt: formatClockMinutes(end / 60),
      source: service.source,
    };
  }

  const hours = isSunday ? QLINE_HOURS.sunday : QLINE_HOURS.weekday;
  return {
    startMinutes: hours.startMinutes,
    endMinutes: hours.endMinutes,
    isSunday,
    opensAt: formatClockMinutes(hours.startMinutes),
    closesAt: formatClockMinutes(hours.endMinutes),
    source: 'published',
  };
}

export function qlineServiceWindow(now = new Date()): QlineWindow {
  return windowFor(detroitNow(now).ymd);
}

/** True while the streetcar is running, using Detroit local time. */
export function qlineServiceRunning(now = new Date()): boolean {
  const { ymd, seconds } = detroitNow(now);
  // A service day can run past midnight, so yesterday's service still counts.
  for (const offset of [-1, 0]) {
    const service = effectiveService(shiftDate(ymd, offset));
    if (!service) continue;
    const scheduled = serviceSeconds(service.ids);
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
  const service = effectiveService(ymd);
  if (!service) return null;
  for (const serviceId of service.ids) {
    const headway = feed.headwayMinutes[serviceId];
    if (headway) return headway;
  }
  return null;
}

export type QlineStatus = {
  running: boolean;
  /** Minutes until the next departure, or null when the line is closed. */
  minutesToNext: number | null;
  /** "EVERY 6–9 MIN" from the agency timetable, or the published headway. */
  label: string;
  window: QlineWindow;
  nextDepartureLabel: string;
};

/**
 * Live status for the QLINE. The running state, the next departure and the
 * headway all come from the agency timetable for the date, so the readout and
 * the vehicle on the map can never disagree.
 */
export function qlineStatus(now = new Date()): QlineStatus {
  const { ymd, seconds } = detroitNow(now);
  const window = qlineServiceWindow(now);
  const minutes = seconds / 60;
  const headway = feedHeadway(now);

  if (!qlineServiceRunning(now)) {
    // The agency published no timetable for this date, so there is no
    // departure to wait for and the vehicle stays at the terminus.
    if (window.source === 'published') {
      return {
        running: false,
        minutesToNext: null,
        label: 'CLOSED',
        window,
        nextDepartureLabel: 'NO TIMETABLE PUBLISHED',
      };
    }
    // Between services: the line opens again at the start of the next one.
    const tomorrow = windowFor(shiftDate(ymd, 1));
    const opensToday = minutes < window.startMinutes;
    const untilOpen = opensToday
      ? window.startMinutes - minutes
      : 24 * 60 - minutes + tomorrow.startMinutes;
    return {
      running: false,
      minutesToNext: Math.ceil(untilOpen),
      label: 'CLOSED',
      window,
      nextDepartureLabel: `OPENS ${opensToday ? window.opensAt : tomorrow.opensAt}`,
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
 * agency has no timetable for the date.
 */
export function qlineStationSchedule(stationId: string, now = new Date()): QlineDeparture[] {
  const { ymd, seconds } = detroitNow(now);
  const service = effectiveService(ymd);
  if (!service) return [];

  const entries: { seconds: number; direction: number }[] = [];
  for (const serviceId of service.ids) {
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

/* ------------------------------------------------------------------ trips */

/** One scheduled run of the streetcar along the corridor. */
export type QlineTrip = {
  /** 1 = northbound to Grand Boulevard, 0 = southbound to Congress Street. */
  direction: 1 | 0;
  /** The station ids in the order the vehicle travels them. */
  stationIds: string[];
  /** The scheduled seconds at each station, in travel order. */
  stops: number[];
  /** The departure from the first stop. */
  startSeconds: number;
  /** The arrival at the last stop. */
  endSeconds: number;
};

/**
 * Where the times come from. The feed publishes a finite calendar, so once it
 * expires the published daily pattern is rolled forward instead.
 */
export type QlineTripSource = 'feed' | 'pattern' | 'none';

export type QlineTrips = {
  /** The trips that are running at the instant. */
  trips: QlineTrip[];
  source: QlineTripSource;
};

/** The number of days a calendar entry covers. */
function calendarSpan(entry: { start: string; end: string }): number {
  const start = Date.UTC(
    +entry.start.slice(0, 4),
    +entry.start.slice(4, 6) - 1,
    +entry.start.slice(6, 8),
  );
  const end = Date.UTC(+entry.end.slice(0, 4), +entry.end.slice(4, 6) - 1, +entry.end.slice(6, 8));
  return Math.round((end - start) / 86_400_000);
}

/**
 * The published daily pattern for a weekday. Used once the feed's calendar
 * stops covering the date, so the streetcar still runs the timetable the
 * agency publishes rather than standing at the terminus.
 */
function patternServiceFor(ymd: string): string | null {
  const weekday = weekdayInDetroit(ymd);
  const candidates = feed.calendar.filter(
    (entry) => entry.days.includes(weekday) && calendarSpan(entry) > 7,
  );
  if (!candidates.length) return null;
  // The most recent pattern wins.
  return [...candidates].sort((a, b) => a.end.localeCompare(b.end)).at(-1)!.id;
}

/** The trips of one service, shifted into the current service day. */
function tripsForService(serviceId: string, shift: number): QlineTrip[] {
  const departures = feed.departures[serviceId];
  const directions = feed.directions[serviceId];
  if (!departures || !directions) return [];

  // The feed lists the stops of a service in whatever order that service
  // runs, so the canonical station order is used to line the times up.
  const stationIds = qlineStations.map((station) => station.id);
  const north: number[][] = [];
  const south: number[][] = [];
  for (const stationId of stationIds) {
    const times = departures[stationId] ?? [];
    const dirs = directions[stationId] ?? [];
    const northbound: number[] = [];
    const southbound: number[] = [];
    times.forEach((value, index) => (dirs[index] === 1 ? northbound : southbound).push(value));
    north.push(northbound);
    south.push(southbound);
  }

  const trips: QlineTrip[] = [];
  const count = Math.max(
    0,
    ...north.map((list) => list.length),
    ...south.map((list) => list.length),
  );
  for (let index = 0; index < count; index += 1) {
    const northStops = north
      .map((list) => list[index])
      .filter((value): value is number => value !== undefined);
    if (northStops.length === stationIds.length) {
      trips.push({
        direction: 1,
        stationIds,
        stops: northStops.map((value) => value + shift),
        startSeconds: northStops[0]! + shift,
        endSeconds: northStops[northStops.length - 1]! + shift,
      });
    }
    const southStops = south
      .map((list) => list[index])
      .filter((value): value is number => value !== undefined);
    if (southStops.length === stationIds.length) {
      // The southbound runs from Grand Boulevard back to Congress Street, so the
      // stops and the times are both in the other order.
      const ordered = [...southStops].reverse();
      trips.push({
        direction: 0,
        stationIds: [...stationIds].reverse(),
        stops: ordered.map((value) => value + shift),
        startSeconds: ordered[0]! + shift,
        endSeconds: ordered[ordered.length - 1]! + shift,
      });
    }
  }
  return trips;
}

/**
 * The streetcar trips that are running at a wall clock instant. The times come
 * from the agency timetable, so the vehicle on the map is where the schedule
 * says it should be.
 */
export function qlineTripsAt(now = new Date()): QlineTrips {
  const { ymd, seconds } = detroitNow(now);
  const today = effectiveService(ymd);
  // Yesterday's service can run past midnight, so its tail is what is still
  // on the corridor early in the morning.
  const yesterday = effectiveService(shiftDate(ymd, -1));
  if (!today && !yesterday) return { trips: [], source: 'none' };

  const trips = [
    ...(today?.ids ?? []).flatMap((id) => tripsForService(id, 0)),
    ...(yesterday?.ids ?? []).flatMap((id) => tripsForService(id, -86_400)),
  ];
  const running = trips.filter((trip) => seconds >= trip.startSeconds && seconds < trip.endSeconds);
  return { trips: running, source: today?.source ?? yesterday?.source ?? 'none' };
}
