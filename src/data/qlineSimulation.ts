import { qlineNorthboundShape, qlineSouthboundShape } from './qlineShape';
import { qlineSegmentSeconds } from './qlineSchedule';
import { qlineStations, type Coordinate } from './transit';

// Illustrative streetcar movement along the Woodward corridor, not live positions.
// Geometry and run times come from the official QLINE GTFS feed.
export const QLINE_DWELL_MS = 15000;

const distance = (a: Coordinate, b: Coordinate) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]);

export type SimulatedStreetcar = { coordinate: Coordinate; bearing: number };

type Segment = {
  fromStationId: string;
  toStationId: string;
  points: Coordinate[];
  lengths: number[];
  length: number;
  durationMs: number;
};

type Stop = {
  stationId: string;
  coordinate: Coordinate;
  dwellMs: number;
};

const stationCoordinate = new Map(qlineStations.map((station) => [station.id, station.coordinate]));
const stationOrder = qlineStations.map((station) => station.id);

const nearestIndex = (shape: Coordinate[], coordinate: Coordinate): number => {
  let best = 0;
  let bestDistance = Infinity;
  shape.forEach((point, index) => {
    const d = distance(point, coordinate);
    if (d < bestDistance) {
      bestDistance = d;
      best = index;
    }
  });
  return best;
};

/** Builds the segments between consecutive stations along one direction shape. */
function buildSegments(shape: Coordinate[], order: string[], direction: number): Segment[] {
  const indices = order.map((id) =>
    nearestIndex(shape, stationCoordinate.get(id) ?? shape[0] ?? [-83.0458, 42.3314]),
  );
  const segments: Segment[] = [];
  for (let i = 0; i < order.length - 1; i += 1) {
    const from = indices[i] ?? 0;
    const to = indices[i + 1] ?? from;
    const points: Coordinate[] = [];
    let index = from;
    for (let guard = 0; guard <= shape.length; guard += 1) {
      const point = shape[index];
      if (point) points.push(point);
      if (index === to) break;
      index = (index + 1) % shape.length;
    }
    const lengths = points.slice(1).map((point, i) => distance(points[i] ?? point, point));
    const length = lengths.reduce((sum, n) => sum + n, 0);
    const scheduled = qlineSegmentSeconds(direction, order[i] ?? '', order[i + 1] ?? '');
    segments.push({
      fromStationId: order[i] ?? '',
      toStationId: order[i + 1] ?? '',
      points,
      lengths,
      length,
      // The feed measures a leg from the departure of one stop to the
      // departure of the next, so one dwell is already inside the number.
      // Only the running time belongs to the segment, otherwise every stop
      // is paid for twice and the streetcar runs slower than the timetable.
      durationMs: Math.max(30_000, ((scheduled ?? 120) - QLINE_DWELL_MS / 1000) * 1000),
    });
  }
  return segments;
}

const northSegments = buildSegments(qlineNorthboundShape, stationOrder, 1);
const southSegments = buildSegments(qlineSouthboundShape, [...stationOrder].reverse(), 0);

/** One full circuit: Congress St up to Grand Blvd and back down. */
const cycleSegments: Segment[] = [...northSegments, ...southSegments];
const northStops = stationOrder.map((id) => ({
  stationId: id,
  coordinate: stationCoordinate.get(id) ?? [-83.0458, 42.3314],
  dwellMs: QLINE_DWELL_MS,
}));
// The southbound list ends on Congress St, which is where the cycle starts,
// so it is not repeated as a second stop.
const cycleStops: Stop[] = [...northStops, ...[...northStops].reverse().slice(1)];
const cycleMs =
  cycleSegments.reduce((sum, segment) => sum + segment.durationMs, 0) +
  cycleStops.reduce((sum, stop) => sum + stop.dwellMs, 0);

const bearingBetween = (a: Coordinate, b: Coordinate): number =>
  (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;

/**
 * Streetcar position. The vehicle runs the corridor from Congress Street to
 * Grand Boulevard and back, dwelling at every stop and travelling at the run
 * times published in the GTFS feed.
 */
export function simulatedQlineTrain(elapsed: number): SimulatedStreetcar {
  if (cycleMs <= 0) return parkedQlineTrain();
  const phase = ((elapsed % cycleMs) + cycleMs) % cycleMs;
  let remaining = phase;

  for (let i = 0; i < cycleStops.length; i += 1) {
    const stop = cycleStops[i]!;
    if (remaining < stop.dwellMs) {
      // Dwelling: hold the bearing of the segment that brought the car in.
      const incoming = cycleSegments[(i - 1 + cycleSegments.length) % cycleSegments.length];
      const last = incoming?.points[incoming.points.length - 1];
      const before = incoming?.points[incoming.points.length - 2] ?? last;
      return {
        coordinate: [stop.coordinate[0], stop.coordinate[1]],
        bearing: last && before ? bearingBetween(before, last) : 0,
      };
    }
    remaining -= stop.dwellMs;

    const segment = cycleSegments[i];
    if (!segment) break;
    if (remaining < segment.durationMs) {
      const target = (segment.length * remaining) / segment.durationMs;
      let covered = 0;
      for (let s = 0; s < segment.lengths.length; s += 1) {
        const length = segment.lengths[s] ?? 0;
        if (covered + length >= target) {
          const progress = length ? (target - covered) / length : 0;
          const a = segment.points[s] ?? segment.points[0] ?? [-83.0458, 42.3314];
          const b = segment.points[s + 1] ?? a;
          return {
            coordinate: [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress],
            bearing: bearingBetween(a, b),
          };
        }
        covered += length;
      }
      const last = segment.points[segment.points.length - 1] ?? [-83.0458, 42.3314];
      const before = segment.points[segment.points.length - 2] ?? last;
      return { coordinate: [last[0], last[1]], bearing: bearingBetween(before, last) };
    }
    remaining -= segment.durationMs;
  }

  return parkedQlineTrain();
}

/** Streetcar parked at the southern terminus, used while the line is closed. */
export function parkedQlineTrain(): SimulatedStreetcar {
  const terminus = qlineStations[0];
  const coordinate = terminus?.coordinate ?? [-83.0458, 42.3314];
  return { coordinate: [coordinate[0], coordinate[1]], bearing: 0 };
}

export const simulatedQlineTrains = (elapsed: number): SimulatedStreetcar[] => [
  simulatedQlineTrain(elapsed),
  simulatedQlineTrain(elapsed + cycleMs / 2),
];

/** Length of one full corridor circuit, in milliseconds. */
export const QLINE_CYCLE_MS = cycleMs;
