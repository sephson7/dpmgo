import { describe, expect, it } from 'vitest';
import { peopleMoverServiceRunning } from './schedule';
import {
  MOVER_ACCEL_FPS2,
  MOVER_CAR_SPACING_FT,
  MOVER_CARS_IN_SERVICE,
  MOVER_CARS_PER_CONSIST,
  MOVER_DWELL_MS,
  MOVER_HEADWAY_MS,
  MOVER_LOOP_MS,
  MOVER_MAX_SPEED_FPS,
  MOVER_SAFE_BUFFER_FT,
  getNextTrainForStation,
  moverArrivalOffsetMs,
  moverConsistGapFt,
  moverFleetElapsed,
  moverLoopLengthFt,
  moverLoopLengthMiles,
  moverSpeedFps,
  simulatedMoverPosition,
  simulatedMoverPositions,
  simulatedMoverTrain,
  simulatedMoverTrains,
} from './trainSimulation';
import { findStation, type Coordinate } from './transit';

const FEET_PER_DEGREE = 364367;

const feetBetween = (a: Coordinate, b: Coordinate) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * FEET_PER_DEGREE;

const nearStation = (coordinate: Coordinate, stationId: string, toleranceFt = 12) => {
  const station = findStation(stationId)!;
  return feetBetween(coordinate, station.coordinate) <= toleranceFt;
};

describe('two-car fleet simulation', () => {
  it('models a 14.5 minute loop and 7.25 minute headway', () => {
    expect(MOVER_LOOP_MS).toBe(870000);
    expect(MOVER_HEADWAY_MS).toBe(435000);
    expect(MOVER_DWELL_MS).toBe(15000);
  });

  it('runs two two-car consists, which is the car count the timetable publishes', () => {
    const cars = simulatedMoverPositions(0);
    expect(cars).toHaveLength(MOVER_CARS_IN_SERVICE);
    expect(MOVER_CARS_PER_CONSIST).toBe(2);
    expect(cars[0]).toEqual(simulatedMoverPosition(0));
    expect(cars[2]).toEqual(simulatedMoverPosition(MOVER_HEADWAY_MS));
    expect(cars[0]).not.toEqual(cars[1]);
  });

  it('dwells for 15 seconds then moves along the loop', () => {
    expect(simulatedMoverPosition(MOVER_DWELL_MS - 1)).toEqual(simulatedMoverPosition(0));
    expect(simulatedMoverPosition(MOVER_DWELL_MS + 1000)).not.toEqual(simulatedMoverPosition(0));
    expect(simulatedMoverPosition(MOVER_LOOP_MS)).toEqual(simulatedMoverPosition(0));
  });

  it('aligns train bearings with forward travel and keeps orientation while dwelling', () => {
    expect(simulatedMoverTrain(0).bearing).toBe(simulatedMoverTrain(MOVER_DWELL_MS - 1).bearing);
    for (let time = MOVER_DWELL_MS + 1000; time < MOVER_LOOP_MS; time += 1000) {
      const train = simulatedMoverTrain(time);
      const nextTrain = simulatedMoverTrain(time + 1);
      // A sample crossing a shape corner spans two bearings rather than one segment.
      if (nextTrain.bearing !== train.bearing) continue;
      const next = nextTrain.coordinate;
      const dx = (next[0] - train.coordinate[0]) * Math.cos((train.coordinate[1] * Math.PI) / 180);
      const dy = next[1] - train.coordinate[1];
      if (Math.hypot(dx, dy) < 1e-12) continue;
      const forward = (Math.atan2(dx, dy) * 180) / Math.PI;
      expect(Math.abs(((train.bearing - forward + 540) % 360) - 180)).toBeLessThan(0.01);
    }
  });

  it('keeps the coupled cars of a consist together', () => {
    for (const elapsed of [MOVER_DWELL_MS + 20000, 300000, 640000]) {
      const [lead, trailing] = simulatedMoverTrains(elapsed);
      expect(lead).toBeDefined();
      expect(trailing).toBeDefined();
      const separation = feetBetween(lead!.coordinate, trailing!.coordinate);
      expect(separation).toBeGreaterThan(1);
      expect(separation).toBeLessThanOrEqual(MOVER_CAR_SPACING_FT * 1.05);
    }
  });

  it('keeps the moving-block separation above the safe stopping buffer', () => {
    for (let elapsed = 0; elapsed < MOVER_LOOP_MS; elapsed += 5000) {
      expect(moverConsistGapFt(elapsed)).toBeGreaterThan(MOVER_SAFE_BUFFER_FT);
    }
  });
});

describe('published fleet specification', () => {
  it('runs the 2.94 mile loop within the published 14.5 minute circuit', () => {
    expect(moverLoopLengthMiles).toBeGreaterThan(2.8);
    expect(moverLoopLengthMiles).toBeLessThan(2.95);
    // The published average speed of 11.7 mph over the whole circuit.
    const averageMph = (moverLoopLengthFt / (MOVER_LOOP_MS / 1000)) * 0.681818;
    expect(averageMph).toBeGreaterThan(11);
    expect(averageMph).toBeLessThan(12.5);
  });

  it('never exceeds the 38 mph top operating speed', () => {
    let fastest = 0;
    for (let elapsed = 0; elapsed < MOVER_LOOP_MS; elapsed += 250) {
      fastest = Math.max(fastest, moverSpeedFps(elapsed));
    }
    expect(fastest).toBeGreaterThan(MOVER_MAX_SPEED_FPS * 0.4);
    expect(fastest).toBeLessThanOrEqual(MOVER_MAX_SPEED_FPS + 0.01);
  });

  it('never exceeds the 3.5 ft/s² comfort acceleration', () => {
    for (let elapsed = 0; elapsed < MOVER_LOOP_MS; elapsed += 100) {
      const change = Math.abs(moverSpeedFps(elapsed + 100) - moverSpeedFps(elapsed)) / 0.1;
      expect(change).toBeLessThanOrEqual(MOVER_ACCEL_FPS2 + 0.01);
    }
  });

  it('accelerates out of a platform and brakes into the next one', () => {
    // One second after leaving the platform the train is rolling.
    expect(moverSpeedFps(MOVER_DWELL_MS + 1000)).toBeGreaterThan(0);
    // And it is standing still while it dwells.
    expect(moverSpeedFps(1000)).toBe(0);
  });
});

describe('official service-hours gate (Detroit time)', () => {
  it('is off overnight and starts at the scheduled opening minute', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-07T04:09:00Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-07T09:59:59Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-07T10:00:00Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-08T04:00:00Z'))).toBe(false);
  });
  it('uses weekend hours and special-event replacement calendars', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-17T13:00:00Z'))).toBe(false);
    expect(peopleMoverServiceRunning(new Date('2026-10-24T13:00:00Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-18T10:00:00Z'))).toBe(true);
  });
  it('continues previous-day special service until 2 AM', () => {
    expect(peopleMoverServiceRunning(new Date('2026-10-31T05:59:59Z'))).toBe(true);
    expect(peopleMoverServiceRunning(new Date('2026-10-31T06:00:00Z'))).toBe(false);
  });
  it('does not imply operation beyond the bundled calendar', () => {
    expect(peopleMoverServiceRunning(new Date('2027-01-02T17:00:00Z'))).toBe(false);
  });
});

describe('arrival telemetry matches the drawn train', () => {
  it('dwells on the platform coordinate of each station', () => {
    for (const id of ['times-square', 'financial', 'grand-circus']) {
      const station = findStation(id);
      const arrival = moverArrivalOffsetMs(id);
      expect(station).toBeDefined();
      expect(arrival).not.toBeNull();
      const position = simulatedMoverPosition(arrival!);
      expect(Math.abs(position[0] - station!.coordinate[0])).toBeLessThan(1e-9);
      expect(Math.abs(position[1] - station!.coordinate[1])).toBeLessThan(1e-9);
    }
  });

  it('counts the countdown down to the moment the train reaches the platform', () => {
    const arrival = moverArrivalOffsetMs('financial')!;
    const next = getNextTrainForStation('financial', arrival + 60000);
    // A train is already standing at the platform and the next one is a
    // half-loop (7.25 minutes) behind.
    expect(next.totalSeconds).toBeGreaterThan(0);
    expect(next.totalSeconds).toBeLessThanOrEqual(Math.ceil(MOVER_HEADWAY_MS / 1000));
  });

  it('reports DUE NOW while the train is on the platform', () => {
    const arrival = moverArrivalOffsetMs('financial')!;
    expect(getNextTrainForStation('financial', arrival).formatted).toBe('DUE NOW');
  });

  it('shows the vehicle that is drawn on the map when the readout says it is due', () => {
    for (const elapsed of [0, 5000, 12000, 12345, 300000, 610000, 869000]) {
      const next = getNextTrainForStation('financial', elapsed);
      if (!next.atPlatform) continue;
      const cars = simulatedMoverTrains(elapsed);
      expect(cars.some((car) => nearStation(car.coordinate, 'financial'))).toBe(true);
    }
  });
});

describe('shared fleet clock', () => {
  it('parks the fleet while the line is closed', () => {
    const closed = new Date('2026-10-07T04:09:00Z').getTime();
    expect(moverFleetElapsed(closed)).toBe(0);
  });

  it('runs the fleet on the shared clock while the line is open', () => {
    const open = new Date('2026-10-07T18:30:00Z').getTime();
    const elapsed = moverFleetElapsed(open);
    expect(elapsed).toBeGreaterThan(0);
    // The clock is deterministic, so the map and the countdown agree.
    expect(moverFleetElapsed(open)).toBe(elapsed);
  });

  it('keeps the map and the countdown on the same clock', () => {
    const now = new Date('2026-10-07T18:30:00Z').getTime();
    const elapsed = moverFleetElapsed(now);
    const next = getNextTrainForStation('financial', elapsed);
    const cars = simulatedMoverTrains(elapsed);
    if (next.atPlatform) {
      expect(cars.some((car) => nearStation(car.coordinate, 'financial'))).toBe(true);
    } else {
      // The drawn vehicle is still short of the platform while it counts down.
      expect(cars.every((car) => !nearStation(car.coordinate, 'financial', 1))).toBe(true);
    }
  });
});
