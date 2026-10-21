import { describe, expect, it } from 'vitest';
import { qlineStations } from './transit';
import { qlineTripsAt } from './qlineSchedule';
import { parkedQlineTrain, scheduledQlineTrains } from './qlineSimulation';

const FEET_PER_DEGREE = 364808.6;

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * FEET_PER_DEGREE;

const congress = qlineStations[0]!.coordinate as [number, number];
const grandBoulevard = qlineStations[qlineStations.length - 1]!.coordinate as [number, number];

/** A Detroit local time on a given date. */
const detroit = (date: string, hour: number, minute = 0) => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
};

const noon = detroit('2026-10-21', 12, 0);

/** The running streetcar closest to a point. */
const nearest = (trains: { coordinate: [number, number] }[], point: [number, number]) =>
  trains
    .map((train) => train.coordinate)
    .sort((a, b) => distance(a, point) - distance(b, point))[0];

/** Local midnight of a date, the frame the scheduled seconds are counted in. */
const midnight = detroit('2026-10-21', 0, 0);

describe('QLINE timetable', () => {
  it('has published trips for the date', () => {
    const { trips, source } = qlineTripsAt(noon);
    expect(trips.length).toBeGreaterThan(0);
    // The feed calendar expired, so the published pattern is rolled forward.
    expect(source).toBe('pattern');
  });

  it('runs the trips the agency published', () => {
    const { trips } = qlineTripsAt(noon);
    for (const trip of trips) {
      expect(trip.stops.length).toBe(qlineStations.length);
      expect(trip.endSeconds).toBeGreaterThan(trip.startSeconds);
      // The times never go backwards along the route the vehicle travels.
      const ordered = trip.stops.every(
        (value, index) => index === 0 || value >= trip.stops[index - 1]!,
      );
      expect(ordered).toBe(true);
    }
  });

  it('has no trips before the first departure or after the last', () => {
    expect(qlineTripsAt(detroit('2026-10-21', 3, 0)).trips).toHaveLength(0);
    expect(qlineTripsAt(detroit('2026-10-22', 0, 30)).trips).toHaveLength(0);
  });
});

describe('QLINE streetcar simulation', () => {
  it('paces the corridor instead of standing still', () => {
    const start = scheduledQlineTrains(noon)[0]?.coordinate;
    const later = scheduledQlineTrains(detroit('2026-10-21', 12, 1))[0]?.coordinate;
    expect(start).toBeDefined();
    expect(later).toBeDefined();
    expect(distance(start!, later!)).toBeGreaterThan(60);
  });

  it('leaves Congress Street on the published departure', () => {
    const { trips } = qlineTripsAt(noon);
    const trip = trips.find((item) => item.direction === 1)!;
    const departure = new Date(midnight.getTime() + trip.startSeconds * 1000);
    const position = nearest(scheduledQlineTrains(departure), congress);
    expect(position).toBeDefined();
    expect(distance(position!, congress)).toBeLessThan(400);
  });

  it('arrives at Grand Boulevard on the published arrival', () => {
    const { trips } = qlineTripsAt(noon);
    const trip = trips.find((item) => item.direction === 1)!;
    // The last stop time is the departure from Grand Boulevard, so the vehicle
    // is standing on the platform just before it.
    const arrival = new Date(midnight.getTime() + (trip.endSeconds - 1) * 1000);
    const position = nearest(scheduledQlineTrains(arrival), grandBoulevard);
    expect(position).toBeDefined();
    expect(distance(position!, grandBoulevard)).toBeLessThan(400);
  });

  it('runs the southbound back down Woodward', () => {
    const { trips } = qlineTripsAt(noon);
    const trip = trips.find((item) => item.direction === 0)!;
    const departure = new Date(midnight.getTime() + trip.startSeconds * 1000);
    const position = nearest(scheduledQlineTrains(departure), grandBoulevard);
    expect(position).toBeDefined();
    expect(distance(position!, grandBoulevard)).toBeLessThan(400);
  });

  it('stays on the Woodward corridor', () => {
    for (let minute = 0; minute < 60; minute += 5) {
      const trains = scheduledQlineTrains(detroit('2026-10-21', 10, minute));
      for (const train of trains) {
        const nearest = Math.min(
          ...qlineStations.map((station) =>
            distance(train.coordinate, station.coordinate as [number, number]),
          ),
        );
        // The vehicle is always within half a block of a stop, never off the
        // corridor.
        expect(nearest).toBeLessThan(1_400);
      }
    }
  });

  it('parks at the terminus while the line is closed', () => {
    expect(parkedQlineTrain().coordinate).toEqual(congress);
    // Nothing runs at three in the morning.
    expect(scheduledQlineTrains(detroit('2026-10-21', 3, 0))).toHaveLength(0);
  });
});
