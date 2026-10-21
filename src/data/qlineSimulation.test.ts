import { describe, expect, it } from 'vitest';
import { qlineStations } from './transit';
import { qlineSegmentSeconds } from './qlineSchedule';
import {
  parkedQlineTrain,
  QLINE_CYCLE_MS,
  QLINE_DWELL_MS,
  simulatedQlineTrain,
} from './qlineSimulation';

const FEET_PER_DEGREE = 364808.6;

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * FEET_PER_DEGREE;

const congress = qlineStations[0]!.coordinate as [number, number];
const grandBoulevard = qlineStations[qlineStations.length - 1]!.coordinate as [number, number];

describe('QLINE streetcar simulation', () => {
  it('paces the corridor instead of standing still', () => {
    const start = simulatedQlineTrain(0).coordinate;
    const later = simulatedQlineTrain(60_000).coordinate;
    expect(distance(start, later)).toBeGreaterThan(60);
  });

  it('dwells on a platform before it moves on', () => {
    // The first stop is Congress Street, where the cycle begins.
    expect(simulatedQlineTrain(0).coordinate).toEqual(congress);
    expect(simulatedQlineTrain(QLINE_DWELL_MS - 1000).coordinate).toEqual(congress);
    expect(simulatedQlineTrain(QLINE_DWELL_MS + 1000).coordinate).not.toEqual(congress);
  });

  it('stays on the Woodward corridor', () => {
    for (let t = 0; t < QLINE_CYCLE_MS; t += 30_000) {
      const position = simulatedQlineTrain(t).coordinate;
      const nearest = Math.min(
        ...qlineStations.map((station) =>
          distance(position, station.coordinate as [number, number]),
        ),
      );
      // The vehicle is always within half a block of a stop, never off the
      // corridor.
      expect(nearest).toBeLessThan(1_400);
    }
  });

  it('matches the published one way trip time', () => {
    const order = qlineStations.map((station) => station.id);
    let publishedMs = 0;
    for (let i = 0; i < order.length - 1; i += 1) {
      publishedMs += (qlineSegmentSeconds(1, order[i]!, order[i + 1]!) ?? 0) * 1000;
    }
    let arrival = -1;
    for (let t = 0; t < QLINE_CYCLE_MS; t += 1000) {
      if (distance(simulatedQlineTrain(t).coordinate, grandBoulevard) < 200) {
        arrival = t;
        break;
      }
    }
    expect(arrival).toBeGreaterThan(0);
    // The simulated run matches the timetable the agency publishes.
    expect(Math.abs(arrival - publishedMs)).toBeLessThan(60_000);
  });

  it('parks at the terminus while the line is closed', () => {
    expect(parkedQlineTrain().coordinate).toEqual(congress);
  });
});
