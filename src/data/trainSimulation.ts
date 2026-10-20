import { peopleMoverShape, peopleMoverStations, type Coordinate, type Station } from './transit';

// Illustrative fleet, not GTFS arrivals or live vehicle positions.
export const MOVER_LOOP_MS = 14.5 * 60 * 1000;
export const MOVER_DWELL_MS = 15000;
export const MOVER_HEADWAY_MS = MOVER_LOOP_MS / 2;

const distance = (a: Coordinate, b: Coordinate) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]);
const shape = peopleMoverShape.slice(0, -1);

export type SimulatedTrain = { coordinate: Coordinate; bearing: number };

type LoopStop = {
  station: Station;
  /** Index of the shape vertex the platform sits on. */
  shapeIndex: number;
  /** Platform coordinate used as the dwell point. */
  platform: Coordinate;
};

const nearestShapeIndex = (coordinate: Coordinate): number => {
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

/**
 * Loop stops in travel order. The People Mover runs one counter-clockwise
 * circuit only, so the stops follow the agency GTFS shape order
 * (Times Square first) and the platforms are the dwell points.
 */
const loopStops: LoopStop[] = peopleMoverStations
  .map(station => ({
    station,
    shapeIndex: nearestShapeIndex(station.coordinate),
    platform: station.coordinate,
  }))
  .sort((a, b) => a.shapeIndex - b.shapeIndex);

type Leg = {
  points: Coordinate[];
  lengths: number[];
  length: number;
  /** Milliseconds the train travels this leg. */
  travelMs: number;
  /** Milliseconds at which the train arrives at the next platform. */
  arrivalMs: number;
  /** Milliseconds at which the train leaves this platform. */
  departureMs: number;
};

const legPoints = (fromIndex: number, toIndex: number): Coordinate[] => {
  const points: Coordinate[] = [];
  let index = fromIndex;
  for (let guard = 0; guard <= shape.length; guard += 1) {
    const point = shape[index];
    if (point) points.push(point);
    if (index === toIndex) break;
    index = (index + 1) % shape.length;
  }
  return points;
};

const legs: Leg[] = loopStops.map((stop, index) => {
  const next = loopStops[(index + 1) % loopStops.length]!;
  const points = legPoints(stop.shapeIndex, next.shapeIndex);
  const lengths = points.slice(1).map((point, i) => distance(points[i] ?? point, point));
  const length = lengths.reduce((sum, n) => sum + n, 0);
  return { points, lengths, length, travelMs: 0, arrivalMs: 0, departureMs: 0 };
});

const totalLength = legs.reduce((sum, leg) => sum + leg.length, 0);
const travelBudget = MOVER_LOOP_MS - loopStops.length * MOVER_DWELL_MS;

// Lay the loop out on a single timeline: dwell at every platform, then ride
// the shape to the next one. Travel time is shared out by distance.
let cursor = 0;
for (const leg of legs) {
  leg.arrivalMs = cursor;
  leg.departureMs = cursor + MOVER_DWELL_MS;
  leg.travelMs = (travelBudget * leg.length) / totalLength;
  cursor = leg.departureMs + leg.travelMs;
}

const trainOnSegment = (a: Coordinate, b: Coordinate, progress: number): SimulatedTrain => ({
  coordinate: [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress],
  bearing:
    (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI,
});

const segmentBearing = (a: Coordinate, b: Coordinate): number =>
  (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;

/**
 * Position of the illustrative train at a point in the loop. The train dwells
 * on the platform coordinate of each station and rides the agency shape in
 * between.
 */
export function simulatedMoverTrain(elapsed: number): SimulatedTrain {
  const phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index]!;
    const stop = loopStops[index]!;

    if (phase < leg.departureMs) {
      // Dwelling on the platform: hold the arrival bearing.
      const incoming = legs[(index - 1 + legs.length) % legs.length]!;
      const last = incoming.points[incoming.points.length - 1];
      const before = incoming.points[incoming.points.length - 2] ?? last;
      const platform = stop.platform;
      const bearing = last && before ? segmentBearing(before, last) : segmentBearing(platform, platform);
      return { coordinate: [platform[0], platform[1]], bearing };
    }

    if (phase < leg.arrivalMs + MOVER_DWELL_MS + leg.travelMs) {
      const travelPhase = phase - leg.departureMs;
      const target = (leg.length * travelPhase) / leg.travelMs;
      let covered = 0;
      for (let i = 0; i < leg.lengths.length; i += 1) {
        const length = leg.lengths[i] ?? 0;
        if (covered + length >= target) {
          const progress = length ? (target - covered) / length : 0;
          const a = leg.points[i] ?? leg.points[0] ?? [-83.0458, 42.3314];
          const b = leg.points[i + 1] ?? a;
          return trainOnSegment(a, b, progress);
        }
        covered += length;
      }
      const last = leg.points[leg.points.length - 1] ?? [-83.0458, 42.3314];
      const before = leg.points[leg.points.length - 2] ?? last;
      return { coordinate: [last[0], last[1]], bearing: segmentBearing(before, last) };
    }
  }

  const first = loopStops[0];
  const platform = first?.platform ?? [-83.0458, 42.3314];
  return { coordinate: [platform[0], platform[1]], bearing: 0 };
}

export const simulatedMoverPosition = (elapsed: number): Coordinate => simulatedMoverTrain(elapsed).coordinate;
export const simulatedMoverTrains = (elapsed: number): SimulatedTrain[] => [
  simulatedMoverTrain(elapsed),
  simulatedMoverTrain(elapsed + MOVER_HEADWAY_MS),
];
export const simulatedMoverPositions = (elapsed: number): Coordinate[] => [
  simulatedMoverPosition(elapsed),
  simulatedMoverPosition(elapsed + MOVER_HEADWAY_MS),
];

/**
 * Trains parked on a platform. Used while the line is closed for service so
 * the map never shows a vehicle stranded between stations.
 */
export function parkedMoverTrain(elapsed: number): SimulatedTrain {
  const phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index]!;
    if (phase < leg.departureMs) {
      const stop = loopStops[index]!;
      return { coordinate: [stop.platform[0], stop.platform[1]], bearing: 0 };
    }
    if (phase < leg.departureMs + leg.travelMs) {
      const next = loopStops[(index + 1) % loopStops.length]!;
      return { coordinate: [next.platform[0], next.platform[1]], bearing: 0 };
    }
  }
  const first = loopStops[0];
  const platform = first?.platform ?? [-83.0458, 42.3314];
  return { coordinate: [platform[0], platform[1]], bearing: 0 };
}

export const parkedMoverTrains = (elapsed: number): SimulatedTrain[] => [
  parkedMoverTrain(elapsed),
  parkedMoverTrain(elapsed + MOVER_HEADWAY_MS),
];

/** Loop position of a station, used to keep arrival telemetry in step with the drawn train. */
export function moverLoopIndex(stationId: string): number {
  return loopStops.findIndex(stop => stop.station.id === stationId);
}

/** Milliseconds after which the train reaches the platform of a given station. */
export function moverArrivalOffsetMs(stationId: string): number | null {
  const index = moverLoopIndex(stationId);
  if (index === -1) return null;
  return legs[index]?.arrivalMs ?? null;
}

/**
 * Time until an illustrative train reaches a station platform. The offset is
 * derived from the same loop geometry that draws the train, so the countdown
 * always matches the vehicle on screen.
 */
export function getNextTrainForStation(stationId: string, elapsed = performance.now()) {
  const arrivalOffset = moverArrivalOffsetMs(stationId);
  if (arrivalOffset === null) {
    return { minutes: 0, seconds: 0, formatted: 'OFFLINE' };
  }

  const trainPhases = [
    ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS,
    (((elapsed + MOVER_HEADWAY_MS) % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS,
  ];

  let minArrivalDiff = Infinity;
  for (const phase of trainPhases) {
    let diff = arrivalOffset - phase;
    if (diff < 0) diff += MOVER_LOOP_MS;
    if (diff < minArrivalDiff) minArrivalDiff = diff;
  }

  const totalSeconds = Math.round(minArrivalDiff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
    formatted: totalSeconds <= 35 ? 'DUE NOW' : `${minutes} MIN`,
  };
}
