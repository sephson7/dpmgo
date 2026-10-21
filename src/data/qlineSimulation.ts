import { qlineNorthboundShape, qlineSouthboundShape } from './qlineShape';
import { qlineTripsAt, type QlineTrip } from './qlineSchedule';
import { detroitNow } from './detroitTime';
import { qlineStations, type Coordinate } from './transit';

// The streetcar follows the agency timetable: the vehicle is placed where the
// published schedule says it should be at that moment.

const distance = (a: Coordinate, b: Coordinate) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]);

export type SimulatedStreetcar = { coordinate: Coordinate; bearing: number };

type Segment = {
  fromStationId: string;
  toStationId: string;
  points: Coordinate[];
  lengths: number[];
  length: number;
};

const stationCoordinate = new Map(qlineStations.map((station) => [station.id, station.coordinate]));
const stationOrder = qlineStations.map((station) => station.id);

const nearestIndex = (shape: Coordinate[], coordinate: Coordinate): number => {
  let best = 0;
  let bestDistance = Infinity;
  shape.forEach((point, i) => {
    const d = distance(point, coordinate);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
};

/** Builds the segments between consecutive stations along one direction shape. */
function buildSegments(shape: Coordinate[], order: string[]): Segment[] {
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
    segments.push({
      fromStationId: order[i] ?? '',
      toStationId: order[i + 1] ?? '',
      points,
      lengths,
      length: lengths.reduce((sum, n) => sum + n, 0),
    });
  }
  return segments;
}

const northSegments = buildSegments(qlineNorthboundShape, stationOrder);
const southSegments = buildSegments(qlineSouthboundShape, [...stationOrder].reverse());

const bearingBetween = (a: Coordinate, b: Coordinate): number =>
  (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;

/** A point a fraction of the way along a segment. */
function interpolate(segment: Segment, progress: number): SimulatedStreetcar | null {
  const target = segment.length * progress;
  let covered = 0;
  for (let i = 0; i < segment.lengths.length; i += 1) {
    const length = segment.lengths[i] ?? 0;
    if (covered + length >= target) {
      const local = length ? (target - covered) / length : 0;
      const a = segment.points[i] ?? segment.points[0] ?? [-83.0458, 42.3314];
      const b = segment.points[i + 1] ?? a;
      return {
        coordinate: [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local],
        bearing: bearingBetween(a, b),
      };
    }
    covered += length;
  }
  const last = segment.points[segment.points.length - 1] ?? [-83.0458, 42.3314];
  const before = segment.points[segment.points.length - 2] ?? last;
  return { coordinate: [last[0], last[1]], bearing: bearingBetween(before, last) };
}

/** Where a scheduled trip is at a given second of the service day. */
function positionOnTrip(trip: QlineTrip, seconds: number): SimulatedStreetcar | null {
  const segments = trip.direction === 1 ? northSegments : southSegments;
  for (let i = 0; i < trip.stops.length - 1; i += 1) {
    const from = trip.stops[i]!;
    const to = trip.stops[i + 1]!;
    if (seconds < from) break;
    if (seconds >= to) continue;
    const segment = segments[i];
    if (!segment) return null;
    const progress = (seconds - from) / Math.max(1, to - from);
    return interpolate(segment, Math.min(1, Math.max(0, progress)));
  }
  return null;
}

/**
 * The streetcars running at a wall clock instant, taken from the published
 * timetable. When the line is closed there is nothing to draw and the caller
 * parks the vehicle at the terminus.
 */
export function scheduledQlineTrains(now = new Date()): SimulatedStreetcar[] {
  const { seconds } = detroitNow(now);
  const { trips } = qlineTripsAt(now);
  const trains: SimulatedStreetcar[] = [];
  for (const trip of trips) {
    const position = positionOnTrip(trip, seconds);
    if (position) trains.push(position);
  }
  return trains;
}

/** Streetcar parked at the southern terminus, used while the line is closed. */
export function parkedQlineTrain(): SimulatedStreetcar {
  const terminus = qlineStations[0];
  const coordinate = terminus?.coordinate ?? [-83.0458, 42.3314];
  return { coordinate: [coordinate[0], coordinate[1]], bearing: 0 };
}
