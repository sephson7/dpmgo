import { peopleMoverServiceWindow } from './schedule';
import { peopleMoverShape, peopleMoverStations, type Coordinate, type Station } from './transit';

/* ---------------------------------------------------------------------------
   Published Detroit People Mover operating facts.

   The loop time, the dwell and the headway come from the agency timetable
   (src/data/schedule.ts). The geometry, the top speed and the acceleration
   come from the published fleet specification: a single elevated loop that
   runs one way only, 2.94 miles of track, a 38 mph top operating speed and a
   3.5 ft/s² comfort curve, with the fleet running in two-car consists.

   The timetable wins where the two disagree. A 14.5 minute circuit over
   13 platforms leaves 51.9 seconds of running time per station leg, which is
   slower than a free-running train on a 1,200 ft block, so the fleet is
   modelled with the published acceleration and top speed as limits and the
   timetable as the schedule it has to keep.
   ------------------------------------------------------------------------ */
export const MOVER_TRACK_LENGTH_FT = 15523; // 2.94 miles of elevated guideway
export const MOVER_LOOP_MS = 14.5 * 60 * 1000; // 14.5 minutes per circuit
export const MOVER_DWELL_MS = 15000; // 15 seconds of dwell at a platform
export const MOVER_HEADWAY_MS = MOVER_LOOP_MS / 2; // 7:15 between two-car consists
export const MOVER_MAX_SPEED_FPS = 56; // 38 mph top operating speed
export const MOVER_ACCEL_FPS2 = 3.5; // comfort acceleration and braking
export const MOVER_CARS_PER_CONSIST = 2; // the fleet runs in pairs
export const MOVER_CARS_IN_SERVICE = 4; // 4 of the 12 cars are on the loop
export const MOVER_CAR_SPACING_FT = 42; // coupled car centres
export const MOVER_SAFE_BUFFER_FT = 300; // moving-block stopping buffer

/** Feet in one degree of latitude at downtown Detroit. */
const FEET_PER_DEGREE = 364367;

const distance = (a: Coordinate, b: Coordinate) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]);
const feet = (a: Coordinate, b: Coordinate) => distance(a, b) * FEET_PER_DEGREE;
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
  .map((station) => ({
    station,
    shapeIndex: nearestShapeIndex(station.coordinate),
    platform: station.coordinate,
  }))
  .sort((a, b) => a.shapeIndex - b.shapeIndex);

/** One phase of the motion profile of a station leg. */
type Phase = {
  kind: 'dwell' | 'accel' | 'cruise' | 'decel';
  durationMs: number;
  distanceFt: number;
  /** Speed at the start of the phase, in feet per second. */
  startSpeed: number;
  /** Speed at the end of the phase, in feet per second. */
  endSpeed: number;
  /** Acceleration over the phase, in feet per second squared. */
  accel: number;
};

type Leg = {
  points: Coordinate[];
  /** Length of each shape segment, in feet. */
  lengths: number[];
  lengthFt: number;
  phases: Phase[];
  /** Milliseconds at which the train arrives at this platform. */
  arrivalMs: number;
  /** Milliseconds at which the train leaves this platform. */
  departureMs: number;
  /** Milliseconds the train travels this leg. */
  travelMs: number;
  /** Feet from the start of the circuit at this platform. */
  startFt: number;
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
  const lengths = points.slice(1).map((point, i) => feet(points[i] ?? point, point));
  return {
    points,
    lengths,
    lengthFt: lengths.reduce((sum, n) => sum + n, 0),
    phases: [],
    arrivalMs: 0,
    departureMs: 0,
    travelMs: 0,
    startFt: 0,
  };
});

/**
 * The free-running profile of one station leg: accelerate from rest, cruise
 * and brake into the platform. This is the shape the timetable stretches.
 */
function physicalPhases(
  lengthFt: number,
): (Omit<Phase, 'durationMs' | 'accel'> & { durationS: number })[] {
  const rampDistance = MOVER_MAX_SPEED_FPS ** 2 / (2 * MOVER_ACCEL_FPS2);
  if (lengthFt >= 2 * rampDistance) {
    const cruiseDistance = lengthFt - 2 * rampDistance;
    return [
      {
        kind: 'accel',
        durationS: MOVER_MAX_SPEED_FPS / MOVER_ACCEL_FPS2,
        distanceFt: rampDistance,
        startSpeed: 0,
        endSpeed: MOVER_MAX_SPEED_FPS,
      },
      {
        kind: 'cruise',
        durationS: cruiseDistance / MOVER_MAX_SPEED_FPS,
        distanceFt: cruiseDistance,
        startSpeed: MOVER_MAX_SPEED_FPS,
        endSpeed: MOVER_MAX_SPEED_FPS,
      },
      {
        kind: 'decel',
        durationS: MOVER_MAX_SPEED_FPS / MOVER_ACCEL_FPS2,
        distanceFt: rampDistance,
        startSpeed: MOVER_MAX_SPEED_FPS,
        endSpeed: 0,
      },
    ];
  }
  const peak = Math.sqrt((MOVER_ACCEL_FPS2 * lengthFt) / 2);
  return [
    {
      kind: 'accel',
      durationS: peak / MOVER_ACCEL_FPS2,
      distanceFt: lengthFt / 2,
      startSpeed: 0,
      endSpeed: peak,
    },
    {
      kind: 'decel',
      durationS: peak / MOVER_ACCEL_FPS2,
      distanceFt: lengthFt / 2,
      startSpeed: peak,
      endSpeed: 0,
    },
  ];
}

const totalLengthFt = legs.reduce((sum, leg) => sum + leg.lengthFt, 0);
const travelBudgetMs = MOVER_LOOP_MS - loopStops.length * MOVER_DWELL_MS;
const physicalTravelS = legs.reduce(
  (sum, leg) =>
    sum + physicalPhases(leg.lengthFt).reduce((phaseSum, phase) => phaseSum + phase.durationS, 0),
  0,
);
/**
 * The timetable is authoritative for the circuit time, so the free-running
 * profile is stretched to fit it. Stretching the time slows every phase
 * down, which keeps the train under the published top speed and inside the
 * comfort acceleration.
 */
const stretch = travelBudgetMs / 1000 / physicalTravelS;

for (const leg of legs) {
  const phases: Phase[] = [
    {
      kind: 'dwell',
      durationMs: MOVER_DWELL_MS,
      distanceFt: 0,
      startSpeed: 0,
      endSpeed: 0,
      accel: 0,
    },
  ];
  for (const phase of physicalPhases(leg.lengthFt)) {
    const durationMs = phase.durationS * stretch * 1000;
    const startSpeed = phase.startSpeed / stretch;
    const endSpeed = phase.endSpeed / stretch;
    phases.push({
      kind: phase.kind,
      durationMs,
      distanceFt: phase.distanceFt,
      startSpeed,
      endSpeed,
      accel: (endSpeed - startSpeed) / (durationMs / 1000),
    });
  }
  leg.phases = phases;
}

/** A slice of the loop timeline with its time and distance offsets. */
type Entry = Phase & {
  legIndex: number;
  /** Milliseconds from the start of the circuit when the phase begins. */
  startMs: number;
  /** Feet from the start of the circuit when the phase begins. */
  startFt: number;
  /** Feet from the start of the circuit when the leg begins. */
  legStartFt: number;
};

const entries: Entry[] = [];
let timeCursor = 0;
let distanceCursor = 0;
legs.forEach((leg, legIndex) => {
  leg.arrivalMs = timeCursor;
  leg.startFt = distanceCursor;
  let legDistance = 0;
  for (const phase of leg.phases) {
    entries.push({
      ...phase,
      legIndex,
      startMs: timeCursor,
      startFt: distanceCursor + legDistance,
      legStartFt: distanceCursor,
    });
    timeCursor += phase.durationMs;
    legDistance += phase.distanceFt;
  }
  leg.departureMs = leg.arrivalMs + MOVER_DWELL_MS;
  leg.travelMs = timeCursor - leg.departureMs;
  distanceCursor += leg.lengthFt;
});
const loopDistanceFt = distanceCursor;

const segmentBearing = (a: Coordinate, b: Coordinate): number =>
  (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;

/** Position and bearing of a point on the shape of one leg. */
function positionOnLeg(leg: Leg, legDistanceFt: number): SimulatedTrain {
  let covered = 0;
  for (let i = 0; i < leg.lengths.length; i += 1) {
    const length = leg.lengths[i] ?? 0;
    if (covered + length >= legDistanceFt) {
      const progress = length ? (legDistanceFt - covered) / length : 0;
      const a = leg.points[i] ?? leg.points[0] ?? [-83.0458, 42.3314];
      const b = leg.points[i + 1] ?? a;
      return {
        coordinate: [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress],
        bearing: segmentBearing(a, b),
      };
    }
    covered += length;
  }
  const last = leg.points[leg.points.length - 1] ?? [-83.0458, 42.3314];
  const before = leg.points[leg.points.length - 2] ?? last;
  return { coordinate: [last[0], last[1]], bearing: segmentBearing(before, last) };
}

/** Distance covered in a phase after `t` seconds. */
const distanceForTime = (entry: Entry, t: number): number =>
  entry.startSpeed * t + 0.5 * entry.accel * t * t;

/** Seconds a phase needs to cover `d` feet. */
function timeForDistance(entry: Entry, d: number): number {
  if (entry.kind === 'cruise') return d / entry.startSpeed;
  if (entry.accel === 0) return 0;
  // Half of a t^2 + v0 t - d = 0
  const discriminant = Math.max(0, entry.startSpeed * entry.startSpeed + 2 * entry.accel * d);
  return (-entry.startSpeed + Math.sqrt(discriminant)) / entry.accel;
}

type LoopState = SimulatedTrain & {
  /** Feet travelled from the start of the circuit. */
  distanceFt: number;
};

const entryAtTime = (elapsed: number): Entry | undefined =>
  entries.find((entry) => elapsed >= entry.startMs && elapsed < entry.startMs + entry.durationMs);

/** The state of the leading car of a consist at a point in the timeline. */
function stateAtTime(elapsed: number): LoopState {
  const phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
  const entry = entryAtTime(phase) ?? entries[entries.length - 1]!;
  const leg = legs[entry.legIndex]!;
  const stop = loopStops[entry.legIndex]!;

  if (entry.kind === 'dwell') {
    // Dwelling on the platform: hold the arrival bearing.
    const incoming = legs[(entry.legIndex - 1 + legs.length) % legs.length]!;
    const last = incoming.points[incoming.points.length - 1];
    const before = incoming.points[incoming.points.length - 2] ?? last;
    const bearing = last && before ? segmentBearing(before, last) : 0;
    return {
      coordinate: [stop.platform[0], stop.platform[1]],
      bearing,
      distanceFt: entry.startFt,
    };
  }

  const travelled = distanceForTime(entry, (phase - entry.startMs) / 1000);
  const distanceFt = entry.startFt + travelled;
  const position = positionOnLeg(leg, distanceFt - entry.legStartFt);
  return { ...position, distanceFt };
}

/** The state of a car `spacing` feet behind a point on the loop. */
function stateBehind(distanceFt: number, spacing: number): SimulatedTrain {
  const target = (((distanceFt - spacing) % loopDistanceFt) + loopDistanceFt) % loopDistanceFt;
  const entry = entries.find(
    (item) =>
      item.distanceFt > 0 && target >= item.startFt && target < item.startFt + item.distanceFt,
  );
  if (!entry) return { coordinate: [-83.0458, 42.3314], bearing: 0 };
  const leg = legs[entry.legIndex]!;
  const travelled = distanceForTime(entry, timeForDistance(entry, target - entry.startFt));
  return positionOnLeg(leg, entry.startFt + travelled - entry.legStartFt);
}

/**
 * Position of the illustrative train at a point in the loop. The train dwells
 * on the platform coordinate of each station and rides the agency shape in
 * between, accelerating out of the platform and braking into the next one.
 */
export function simulatedMoverTrain(elapsed: number): SimulatedTrain {
  const { coordinate, bearing } = stateAtTime(elapsed);
  return { coordinate, bearing };
}

/**
 * The fleet on the loop: two two-car consists, 7:15 apart, which is the
 * 3:45 spacing the agency timetable publishes for a single car.
 */
export const simulatedMoverTrains = (elapsed: number): SimulatedTrain[] => {
  const cars: SimulatedTrain[] = [];
  for (const offset of [0, MOVER_HEADWAY_MS]) {
    const state = stateAtTime(elapsed + offset);
    cars.push({ coordinate: state.coordinate, bearing: state.bearing });
    cars.push(stateBehind(state.distanceFt, MOVER_CAR_SPACING_FT));
  }
  return cars;
};

export const simulatedMoverPosition = (elapsed: number): Coordinate =>
  simulatedMoverTrain(elapsed).coordinate;
export const simulatedMoverPositions = (elapsed: number): Coordinate[] =>
  simulatedMoverTrains(elapsed).map((train) => train.coordinate);

/**
 * Trains parked on a platform. Used while the line is closed for service so
 * the map never shows a vehicle stranded between stations.
 */
export function parkedMoverTrain(elapsed: number): SimulatedTrain {
  const phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
  const entry = entryAtTime(phase);
  const index = entry?.legIndex ?? 0;
  const stop = loopStops[index]!;
  const platform = stop.platform;
  return { coordinate: [platform[0], platform[1]], bearing: 0 };
}

export const parkedMoverTrains = (elapsed: number): SimulatedTrain[] => {
  const cars: SimulatedTrain[] = [];
  for (const offset of [0, MOVER_HEADWAY_MS]) {
    const phase = (((elapsed + offset) % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
    const entry = entryAtTime(phase);
    const index = entry?.legIndex ?? 0;
    const stop = loopStops[index]!;
    const platform = stop.platform;
    cars.push({ coordinate: [platform[0], platform[1]], bearing: 0 });
    cars.push(stateBehind(legs[index]!.startFt, MOVER_CAR_SPACING_FT));
  }
  return cars;
};

/** Loop position of a station, used to keep arrival telemetry in step with the drawn train. */
export function moverLoopIndex(stationId: string): number {
  return loopStops.findIndex((stop) => stop.station.id === stationId);
}

/** Length of the loop along the agency shape, in feet. */
export const moverLoopLengthFt = loopDistanceFt;

/** Length of the loop along the agency shape, in miles. */
export const moverLoopLengthMiles = loopDistanceFt / 5280;

/** Speed of the leading car at a point in the timeline, in feet per second. */
export function moverSpeedFps(elapsed: number): number {
  const phase = ((elapsed % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS;
  const entry = entryAtTime(phase);
  if (!entry || entry.kind === 'dwell') return 0;
  return entry.startSpeed + entry.accel * ((phase - entry.startMs) / 1000);
}

/**
 * Distance along the loop between the two consists, in feet. A moving-block
 * system keeps this above the safe stopping buffer at all times.
 */
export function moverConsistGapFt(elapsed: number): number {
  const lead = stateAtTime(elapsed);
  const follower = stateAtTime(elapsed + MOVER_HEADWAY_MS);
  const gap = follower.distanceFt - lead.distanceFt;
  return gap < 0 ? gap + loopDistanceFt : gap;
}

/** Milliseconds after which the train reaches the platform of a given station. */
export function moverArrivalOffsetMs(stationId: string): number | null {
  const index = moverLoopIndex(stationId);
  if (index === -1) return null;
  return legs[index]?.arrivalMs ?? null;
}

/**
 * Position of the fleet timeline for a wall-clock instant. The fleet only
 * moves while the line is in service, so the timeline is anchored to the
 * start of the current service window. The map and the arrival countdown
 * share this clock, so the vehicle on screen and the readout always agree.
 */
export function moverFleetElapsed(now: number = Date.now()): number {
  const window = peopleMoverServiceWindow(new Date(now));
  if (!window) return 0;
  return Math.max(0, now - window.start);
}

/** The arrival readout for one station, derived from the drawn fleet. */
export type ArrivalReadout = {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  /** True while a consist is standing on the platform. */
  atPlatform: boolean;
  /** Short label for the HUD, e.g. "4 MIN" or "DUE NOW". */
  formatted: string;
};

/**
 * Time until an illustrative train reaches a station platform. The offset is
 * derived from the same loop geometry that draws the train, so the countdown
 * always matches the vehicle on screen.
 */
export function getNextTrainForStation(
  stationId: string,
  elapsed = moverFleetElapsed(),
): ArrivalReadout {
  const arrivalOffset = moverArrivalOffsetMs(stationId);
  if (arrivalOffset === null) {
    return { minutes: 0, seconds: 0, totalSeconds: 0, formatted: 'OFFLINE', atPlatform: false };
  }

  const trainPhases = [0, MOVER_HEADWAY_MS].map(
    (offset) => (((elapsed + offset) % MOVER_LOOP_MS) + MOVER_LOOP_MS) % MOVER_LOOP_MS,
  );

  let minArrivalDiff = Infinity;
  let atPlatform = false;
  for (const phase of trainPhases) {
    const sinceArrival = phase - arrivalOffset;
    // A consist standing at the platform is the next train.
    if (sinceArrival >= 0 && sinceArrival < MOVER_DWELL_MS) {
      minArrivalDiff = 0;
      atPlatform = true;
      break;
    }
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
    atPlatform,
    formatted: totalSeconds <= 35 ? 'DUE NOW' : `${minutes} MIN`,
  };
}
