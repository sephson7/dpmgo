import { peopleMoverShape, peopleMoverStations, type Coordinate } from './transit';

// Illustrative fleet, not GTFS arrivals or live vehicle positions.
export const MOVER_LOOP_MS = 14.5 * 60 * 1000;
export const MOVER_DWELL_MS = 15000;
export const MOVER_HEADWAY_MS = MOVER_LOOP_MS / 2;
const distance = (a: Coordinate, b: Coordinate) => Math.hypot((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]);
const shape = peopleMoverShape.slice(0, -1);
const stops = peopleMoverStations.map(station => shape.reduce((best, coordinate, index) => distance(coordinate, station.coordinate) < distance(shape[best] ?? coordinate, station.coordinate) ? index : best, 0)).sort((a, b) => a - b);
const legs = stops.map((start, index) => {
  const next = stops[(index + 1) % stops.length] ?? 0;
  const end = next > start ? next : next + shape.length;
  const points = Array.from({ length: end - start + 1 }, (_, offset) => shape[(start + offset) % shape.length] ?? [-83.0458, 42.3314] as Coordinate);
  const lengths = points.slice(1).map((p, i) => distance(points[i] ?? p, p));
  return { points, lengths, length: lengths.reduce((sum, n) => sum + n, 0) };
});
const totalLength = legs.reduce((sum, leg) => sum + leg.length, 0);
const travelBudget = MOVER_LOOP_MS - stops.length * MOVER_DWELL_MS;

export type SimulatedTrain = { coordinate: Coordinate; bearing: number };
const trainOnSegment = (a: Coordinate, b: Coordinate, progress: number): SimulatedTrain => ({
  coordinate: [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress],
  bearing: Math.atan2((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]) * 180 / Math.PI,
});

export function simulatedMoverTrain(elapsed: number): SimulatedTrain {
  let phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
  for (const leg of legs) {
    if (phase < MOVER_DWELL_MS) {
      const a = leg.points[0] ?? [-83.0458, 42.3314];
      return trainOnSegment(a, leg.points[1] ?? a, 0);
    }
    phase -= MOVER_DWELL_MS;
    const travel = travelBudget * leg.length / totalLength;
    if (phase < travel) {
      const target = leg.length * phase / travel;
      let covered = 0;
      for (let i = 0; i < leg.lengths.length; i += 1) {
        const length = leg.lengths[i] ?? 0;
        if (covered + length >= target) {
          const progress = length ? (target - covered) / length : 0;
          const a = leg.points[i] ?? [-83.0458, 42.3314];
          const b = leg.points[i + 1] ?? a;
          return trainOnSegment(a, b, progress);
        }
        covered += length;
      }
    }
    phase -= travel;
  }
  const a = legs[0]?.points[0] ?? [-83.0458, 42.3314];
  return trainOnSegment(a, legs[0]?.points[1] ?? a, 0);
}

export const simulatedMoverPosition = (elapsed: number): Coordinate => simulatedMoverTrain(elapsed).coordinate;
export const simulatedMoverTrains = (elapsed: number): SimulatedTrain[] => [simulatedMoverTrain(elapsed), simulatedMoverTrain(elapsed + MOVER_HEADWAY_MS)];
export const simulatedMoverPositions = (elapsed: number): Coordinate[] => [simulatedMoverPosition(elapsed), simulatedMoverPosition(elapsed + MOVER_HEADWAY_MS)];