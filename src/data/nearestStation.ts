import { milesBetween, type Coordinate, type Station } from './transit';

/** Only frame a local station, never fly remote visitors into Detroit automatically. */
export function localNearestStation(position: Coordinate, stations: Station[]): Station | null {
  if (position.some((value) => !Number.isFinite(value))) return null;
  let nearest: Station | null = null;
  let distance = 2;
  for (const station of stations) {
    const candidate = milesBetween(position, station.coordinate);
    if (candidate <= distance) {
      nearest = station;
      distance = candidate;
    }
  }
  return nearest;
}
