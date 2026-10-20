import { allTransitStations, milesBetween, type Coordinate, type Station } from './transit';

/**
 * Downtown Detroit parking garages for the park-once initiative.
 *
 * Coordinates are approximate entrance points and are good enough for map
 * placement and walking estimates. Rates, hours and space counts change, so
 * the app always shows them as informational and tells riders to confirm on
 * arrival.
 */
export type ParkingGarage = {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  operator: string;
  /** Published number of spaces, where known. */
  spaces?: number;
  hours: string;
  rateNote: string;
  /** Park once and ride the People Mover or the QLINE. */
  parkOnce: boolean;
  /** Transit stop the garage connects to. */
  nearestStationId: string;
  nearestStationName: string;
  line: 'mover' | 'qline';
};

export const parkingGarages: ParkingGarage[] = [
  {
    id: 'grand-circus-garage',
    name: 'Grand Circus Underground Garage',
    address: '1600 Woodward Ave',
    coordinate: [-83.0503, 42.3366],
    operator: 'City of Detroit Municipal Parking Department',
    spaces: 700,
    hours: 'Mon–Fri 7:00 AM – 5:00 PM, plus event service',
    rateNote: 'Metered event and special-event rates apply',
    parkOnce: true,
    nearestStationId: 'grand-circus',
    nearestStationName: 'Grand Circus Park Station',
    line: 'mover',
  },
  {
    id: 'millennium-garage',
    name: 'Millennium Garage',
    address: '432 W Congress St',
    coordinate: [-83.0459, 42.3272],
    operator: 'City of Detroit Municipal Parking Department',
    spaces: 600,
    hours: 'Mon–Fri 6:00 AM – 11:00 PM, weekends and holidays as needed',
    rateNote: 'Metered garage rates',
    parkOnce: true,
    nearestStationId: 'financial',
    nearestStationName: 'Financial District Station',
    line: 'mover',
  },
  {
    id: 'first-street-deck',
    name: 'First Street Parking Deck',
    address: '621 Cass Ave',
    coordinate: [-83.0508, 42.33],
    operator: 'Wayne County / Sterling Group',
    spaces: 1450,
    hours: 'Mon–Fri 7:00 AM – 11:00 PM, Sat 9:00 AM – 5:00 PM',
    rateNote: 'Monthly and transient parking available',
    parkOnce: true,
    nearestStationId: 'fort-cass',
    nearestStationName: 'Fort / Cass Station',
    line: 'mover',
  },
  {
    id: 'buhl-garage',
    name: 'Buhl Building Garage',
    address: '525 Griswold St',
    coordinate: [-83.0459, 42.3285],
    operator: 'Buhl Building LLC',
    spaces: 657,
    hours: 'Daily 6:00 AM – midnight',
    rateNote: 'Metered garage rates',
    parkOnce: true,
    nearestStationId: 'financial',
    nearestStationName: 'Financial District Station',
    line: 'mover',
  },
  {
    id: 'centre-garage',
    name: 'Centre Garage',
    address: '414 Renaissance Dr',
    coordinate: [-83.0409, 42.3292],
    operator: 'Miller Parking',
    spaces: 1275,
    hours: 'Daily 6:00 AM – midnight',
    rateNote: 'Metered garage rates',
    parkOnce: true,
    nearestStationId: 'renaissance',
    nearestStationName: 'Renaissance Center Station',
    line: 'mover',
  },
  {
    id: 'woodward-1001-garage',
    name: '1001 Woodward Garage',
    address: '35 State St',
    coordinate: [-83.0471, 42.3325],
    operator: 'Metropolis Technologies',
    spaces: 731,
    hours: 'Daily, overnight parking available',
    rateNote: 'Drive-up rates, height limit 7 ft 9 in, EV charging',
    parkOnce: true,
    nearestStationId: 'ql-campus-martius',
    nearestStationName: 'Campus Martius (QLINE)',
    line: 'qline',
  },
  {
    id: 'one-woodward-garage',
    name: 'One Woodward Avenue Garage',
    address: '1 Woodward Ave',
    coordinate: [-83.0478, 42.3311],
    operator: 'Miller Parking',
    spaces: 100,
    hours: 'Daily 6:00 AM – midnight',
    rateNote: 'Private garage, validation from adjacent tenants',
    parkOnce: true,
    nearestStationId: 'ql-campus-martius',
    nearestStationName: 'Campus Martius (QLINE)',
    line: 'qline',
  },
  {
    id: 'joe-louis-garage',
    name: 'Joe Louis Arena Garage',
    address: '900 W Jefferson Ave',
    coordinate: [-83.0452, 42.3287],
    operator: 'City of Detroit Municipal Parking Department',
    spaces: 3000,
    hours: 'Event and holiday service only',
    rateNote: 'Event rates apply, usually posted on site',
    parkOnce: false,
    nearestStationId: 'financial',
    nearestStationName: 'Financial District Station',
    line: 'mover',
  },
  {
    id: 'ford-field-garage',
    name: 'Ford Field Garage',
    address: '2001 Brush St',
    coordinate: [-83.045, 42.3398],
    operator: 'City of Detroit Municipal Parking Department',
    hours: 'Event and special event service',
    rateNote: 'Event rates apply, usually posted on site',
    parkOnce: false,
    nearestStationId: 'broadway',
    nearestStationName: 'Broadway Station',
    line: 'mover',
  },
  {
    id: 'woodward-1000-garage',
    name: '1000 Woodward Garage',
    address: '63 Monroe Ave',
    coordinate: [-83.0462, 42.3299],
    operator: '1000 Woodward LLC',
    hours: 'Daily 6:00 AM – midnight',
    rateNote: 'Metered garage rates',
    parkOnce: true,
    nearestStationId: 'ql-congress',
    nearestStationName: 'Congress Street (QLINE)',
    line: 'qline',
  },
  {
    id: 'madison-garage',
    name: 'Madison Street Garage',
    address: '351 Gratiot Ave',
    coordinate: [-83.0457, 42.3321],
    operator: 'Park Rite',
    hours: 'Daily 6:00 AM – midnight',
    rateNote: 'Monthly and transient parking available',
    parkOnce: true,
    nearestStationId: 'cadillac',
    nearestStationName: 'Cadillac Center Station',
    line: 'mover',
  },
  {
    id: 'wayne-state-lot-12',
    name: 'Wayne State Lot 12 · QLINE Park & Ride',
    address: '6050 Woodward Ave',
    coordinate: [-83.0701, 42.3672],
    operator: 'Wayne State University',
    hours: 'Weekend park & ride, access off Harper St',
    rateNote: '$5 weekend parking, free ride on the QLINE',
    parkOnce: true,
    nearestStationId: 'ql-amsterdam',
    nearestStationName: 'Amsterdam Street (QLINE)',
    line: 'qline',
  },
];

export type NearbyParking = ParkingGarage & { walkMiles: number };

const garageStation = (garage: ParkingGarage): Station | undefined =>
  allTransitStations.find(station => station.id === garage.nearestStationId);

/** Garages that connect to a station, closest first. */
export function nearbyParking(station: Station): NearbyParking[] {
  return parkingGarages
    .map(garage => {
      const anchor = garageStation(garage);
      const origin = anchor?.entrance ?? garage.coordinate;
      return { ...garage, walkMiles: milesBetween(origin, garage.coordinate) * 1.25 };
    })
    .filter(garage => garage.walkMiles <= 0.6)
    .sort((a, b) => a.walkMiles - b.walkMiles);
}

/** Garages that work for a park-once trip to the given station. */
export function parkOnceGarages(station: Station): NearbyParking[] {
  return nearbyParking(station).filter(garage => garage.parkOnce);
}
