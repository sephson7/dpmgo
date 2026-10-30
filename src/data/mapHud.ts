import { allTransitStations } from './transit';
import { peopleMoverServiceRunning } from './schedule';
import { moverDrawerArrivals } from './moverDrawerArrivals';
import { qlineServiceRunning, qlineStationSchedule } from './qlineSchedule';

// Geographic labels use actual station anchors, never imaginary platforms.
export const mapHudStops = [
  { stationId: 'grand-circus', label: 'Grand Circus', detail: 'Grand Circus Park Station' },
  { stationId: 'ql-campus-martius', label: 'Campus Martius', detail: 'Campus Martius stop' },
  { stationId: 'ql-congress', label: 'Woodward & Fort', detail: 'Board at Congress Street' },
] as const;

export function mapHudArrival(stationId: string, now: Date): number | null {
  const station = allTransitStations.find((item) => item.id === stationId);
  if (!station) return null;
  if (station.line === 'mover') {
    if (!peopleMoverServiceRunning(now)) return null;
    const arrival = moverDrawerArrivals(stationId, now)[0];
    return arrival?.source === 'simulation' ? arrival.minutes : null;
  }
  if (!qlineServiceRunning(now)) return null;
  const arrival = qlineStationSchedule(stationId, now)[0];
  return arrival ? Math.max(0, arrival.minutes) : null;
}
