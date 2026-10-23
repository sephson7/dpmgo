import { describe, expect, it } from 'vitest';
import { allTransitStations, peopleMoverStations } from './transit';
import { localNearestStation } from './nearestStation';

describe('local station snap', () => {
  it('chooses the nearest eligible station at a platform', () => {
    const station = peopleMoverStations[0];
    if (!station) throw new Error('Missing station data');
    expect(localNearestStation(station.coordinate, allTransitStations)?.id).toBe(station.id);
  });
  it('does not fly remote riders or invalid fixes into Detroit', () => {
    expect(localNearestStation([-74, 40.7], allTransitStations)).toBeNull();
    expect(localNearestStation([NaN, 42], allTransitStations)).toBeNull();
    expect(localNearestStation([-83, 42], [])).toBeNull();
  });
});