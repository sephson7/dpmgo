// Shared clock helpers so every module reasons in Detroit local time.
export type DetroitClock = {
  /** Local calendar date as YYYYMMDD. */
  ymd: string;
  /** Seconds elapsed since local midnight. */
  seconds: number;
  /** 0 = Monday ... 6 = Sunday. */
  weekday: number;
};

const DETROIT_ZONE = 'America/Detroit';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DETROIT_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function detroitNow(now = new Date()): DetroitClock {
  const parts = Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  const ymd = `${parts['year']}${parts['month']}${parts['day']}`;
  return {
    ymd,
    seconds: Number(parts['hour']) * 3600 + Number(parts['minute']) * 60 + Number(parts['second']),
    weekday: weekdayInDetroit(ymd),
  };
}

/** Offset of the Detroit time zone from UTC at an instant, in milliseconds. */
function zoneOffsetMs(date: Date): number {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts['year']),
    Number(parts['month']) - 1,
    Number(parts['day']),
    Number(parts['hour']) % 24,
    Number(parts['minute']),
    Number(parts['second']),
  );
  return asUtc - date.getTime();
}

/**
 * The UTC instant of local midnight in Detroit on a YYYYMMDD date. The zone
 * only changes at 2 AM, so the offset taken at the same calendar morning is
 * the offset of that local midnight.
 */
export function detroitMidnightMs(ymd: string): number {
  const year = +ymd.slice(0, 4);
  const month = +ymd.slice(4, 6) - 1;
  const day = +ymd.slice(6, 8);
  const guess = Date.UTC(year, month, day, 0, 0, 0);
  return guess - zoneOffsetMs(new Date(guess));
}

/** Shifts a YYYYMMDD date by whole days. */
export function shiftDate(ymd: string, days: number): string {
  const d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8) + days));
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** 0 = Monday ... 6 = Sunday for a YYYYMMDD date. */
export function weekdayInDetroit(ymd: string): number {
  return (
    (new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))).getUTCDay() + 6) %
    7
  );
}

/** Formats minutes past midnight as a 12 hour clock label. */
export function formatClockMinutes(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.floor((wrapped % 60) / 10) * 10;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
