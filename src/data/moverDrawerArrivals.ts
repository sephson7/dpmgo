import { detroitNow, formatClockMinutes } from './detroitTime';
import { peopleMoverServiceWindow, stationSchedule } from './schedule';
import { getNextTrainForStation, moverFleetElapsed } from './trainSimulation';

export type MoverDrawerArrival = {
  time: string;
  minutes: number;
  note: string;
  source: 'simulation' | 'planning' | 'schedule';
};

/** The planning window is not a prediction of a second simulated vehicle. */
export function moverDrawerArrivals(stationId: string, now = new Date()): MoverDrawerArrival[] {
  const schedule = stationSchedule(stationId, now);
  if (!schedule.trains.length) return [];
  const window = peopleMoverServiceWindow(now);
  if (!window) {
    return schedule.trains.slice(0, 2).map((train) => ({
      time: train.time,
      minutes: train.minutes,
      note: train.day ?? `In ~${train.minutes} min · Scheduled`,
      source: 'schedule',
    }));
  }

  const next = getNextTrainForStation(stationId, moverFleetElapsed(now.getTime()));
  if (next.formatted === 'OFFLINE' || now.getTime() + next.totalSeconds * 1000 >= window.end) {
    return [];
  }
  const clock = detroitNow(now);
  const arrivals: MoverDrawerArrival[] = [
    {
      time: formatClockMinutes((clock.seconds + next.totalSeconds) / 60),
      minutes: Math.ceil(next.totalSeconds / 60),
      note: next.atPlatform
        ? 'Due at platform · Simulated'
        : `In ~${Math.ceil(next.totalSeconds / 60)} min · Simulated`,
      source: 'simulation',
    },
  ];

  // Do not advertise a window that extends past the official service close.
  if (now.getTime() + 20 * 60 * 1000 < window.end) {
    arrivals.push({
      time: '15–20 MIN',
      minutes: 15,
      note: 'Planning window · Not live',
      source: 'planning',
    });
  }
  return arrivals;
}
