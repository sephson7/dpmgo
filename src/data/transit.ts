export type Coordinate = [number, number];
export { peopleMoverShape } from './peopleMoverShape';

export type Restaurant = {
  name: string;
  category: string;
  price: string;
  url: string;
};

export type Place = Restaurant & {
  id: string;
  coordinate: Coordinate;
  lateNight?: boolean | undefined;
  sponsored?: boolean | undefined;
  sponsorTier?: 'anchor' | 'featured' | undefined;
  sponsorTagline?: string | undefined;
  sponsorPerk?: string | undefined;
  sponsorStationId?: string | undefined;
};

export type Station = {
  id: string;
  name: string;
  coordinate: Coordinate;
  entrance: Coordinate;
  neighborhood: string;
  crossStreets: string;
  elevator: boolean;
  adaCompliant: boolean;
  entranceNotes: string;
  restaurants: Restaurant[];
};

export type ParkingStructure = {
  id: string;
  name: string;
  stationId: string;
  address: string;
  coordinate: Coordinate;
  walkMinutes: number;
  capacityNote: string;
};

export type VenueDestination = {
  id: string;
  name: string;
  category: 'sports' | 'entertainment' | 'civic' | 'convention';
  nearestStationId: string;
  coordinate: Coordinate;
  address: string;
  description: string;
};

// Platform positions and nearest public entrances from Detroit Transportation Corporation GTFS stops.txt:
export const peopleMoverStations: Station[] = [
  {
    id: 'michigan',
    name: 'Michigan Station',
    coordinate: [-83.052120, 42.331363],
    entrance: [-83.052151, 42.331464],
    neighborhood: 'West Downtown',
    crossStreets: 'Michigan Ave & Cass Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Street elevator and escalator lobby located on south side of Michigan Ave.',
    restaurants: [],
  },
  {
    id: 'fort-cass',
    name: 'Fort / Cass Station',
    coordinate: [-83.051150, 42.329505],
    entrance: [-83.051032, 42.329415],
    neighborhood: 'West Downtown',
    crossStreets: 'Fort St & Cass Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Elevator entrance accessible from northeast corner of Fort St.',
    restaurants: [],
  },
  {
    id: 'huntington',
    name: 'Huntington Place Station',
    coordinate: [-83.049846, 42.328212],
    entrance: [-83.049867, 42.328406],
    neighborhood: 'Convention District',
    crossStreets: 'Washington Blvd & Congress St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Direct indoor concourse access from 3rd floor of convention center.',
    restaurants: [],
  },
  {
    id: 'water-square',
    name: 'Water Square Station',
    coordinate: [-83.052671, 42.325233],
    entrance: [-83.052563, 42.325192],
    neighborhood: 'Riverfront',
    crossStreets: 'Atwater St & 3rd St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Ground floor riverwalk entrance adjacent to Water Square residential tower.',
    restaurants: [],
  },
  {
    id: 'financial',
    name: 'Financial District Station',
    coordinate: [-83.046691, 42.328680],
    entrance: [-83.046507, 42.328756],
    neighborhood: 'Financial District',
    crossStreets: 'Larned St & Griswold St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Entrance at 150 W Jefferson building; elevator available via lower concourse.',
    restaurants: [],
  },
  {
    id: 'millender',
    name: 'Millender Center Station',
    coordinate: [-83.042001, 42.330273],
    entrance: [-83.042146, 42.330326],
    neighborhood: 'Civic Center',
    crossStreets: 'Randolph St & Congress St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Skywalk connection to Millender Center atrium and Courtyard by Marriott.',
    restaurants: [],
  },
  {
    id: 'renaissance',
    name: 'Renaissance Center Station',
    coordinate: [-83.039983, 42.330157],
    entrance: [-83.040065, 42.329918],
    neighborhood: 'Riverfront',
    crossStreets: 'Jefferson Ave & Beaubien St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Level 2 walkway directly connecting Tower 100/200 inside GM RenCen.',
    restaurants: [],
  },
  {
    id: 'bricktown',
    name: 'Bricktown Station',
    coordinate: [-83.041194, 42.333326],
    entrance: [-83.041262, 42.333473],
    neighborhood: 'Bricktown',
    crossStreets: 'E Fort St & Brush St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Standalone brick portal entrance on south side of Fort St.',
    restaurants: [],
  },
  {
    id: 'greektown',
    name: 'Greektown Station',
    coordinate: [-83.042419, 42.334617],
    entrance: [-83.042320, 42.334693],
    neighborhood: 'Greektown',
    crossStreets: 'Monroe St & Beaubien St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Direct pedestrian bridge to Hollywood Casino Greektown Level 3.',
    restaurants: [],
  },
  {
    id: 'cadillac',
    name: 'Cadillac Center Station',
    coordinate: [-83.046157, 42.333710],
    entrance: [-83.046330, 42.333644],
    neighborhood: 'Cadillac Square',
    crossStreets: 'Gratiot Ave & Library St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Street-level entrance facing Campus Martius and Hudson’s Detroit development.',
    restaurants: [],
  },
  {
    id: 'broadway',
    name: 'Broadway Station',
    coordinate: [-83.048213, 42.335449],
    entrance: [-83.048179, 42.335569],
    neighborhood: 'Broadway',
    crossStreets: 'Broadway St & John R St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Integrated facade entrance near Detroit Opera House and Comerica Park.',
    restaurants: [],
  },
  {
    id: 'grand-circus',
    name: 'Grand Circus Park Station',
    coordinate: [-83.050592, 42.335782],
    entrance: [-83.050629, 42.335804],
    neighborhood: 'Grand Circus Park',
    crossStreets: 'Woodward Ave & Park Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Direct transfer point to QLINE Woodward streetcar and Comerica/Ford Field.',
    restaurants: [],
  },
  {
    id: 'times-square',
    name: 'Times Square Station',
    coordinate: [-83.052159, 42.333579],
    entrance: [-83.051904, 42.333594],
    neighborhood: 'West Downtown',
    crossStreets: 'Times Square & Grand River Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Elevator and dual stairwell entrance next to DTE Energy headquarters.',
    restaurants: [],
  },
];

// Park Once Engine: Parking Structures Paired with Stations
export const parkingStructures: ParkingStructure[] = [
  {
    id: 'ford-underground',
    name: 'Ford Underground Garage',
    stationId: 'huntington',
    address: '30 E. Jefferson Ave, Detroit, MI',
    coordinate: [-83.0475, 42.3278],
    walkMinutes: 3,
    capacityNote: 'High Capacity · Direct Convention Center Access',
  },
  {
    id: 'grand-circus-garage',
    name: 'Grand Circus Park Underground Garage',
    stationId: 'grand-circus',
    address: '1600 Woodward Ave, Detroit, MI',
    coordinate: [-83.0508, 42.3355],
    walkMinutes: 2,
    capacityNote: 'Ideal for Tigers, Lions & Ford Field Events',
  },
  {
    id: 'millennium-garage',
    name: 'Millennium Garage',
    stationId: 'financial',
    address: '432 W. Congress St, Detroit, MI',
    coordinate: [-83.0470, 42.3280],
    walkMinutes: 3,
    capacityNote: 'Covered Gateway to Financial Core & Hart Plaza',
  },
  {
    id: 'z-deck-garage',
    name: 'Z Deck Garage / One Campus Martius',
    stationId: 'cadillac',
    address: '1234 Library St, Detroit, MI',
    coordinate: [-83.0455, 42.3335],
    walkMinutes: 2,
    capacityNote: 'Murals & Central Downtown Hub',
  },
  {
    id: 'opera-house-garage',
    name: 'Opera House Parking Center Garage',
    stationId: 'broadway',
    address: '248 John R St, Detroit, MI',
    coordinate: [-83.0485, 42.3350],
    walkMinutes: 2,
    capacityNote: 'Directly Adjacent to Theater District',
  },
  {
    id: 'rencen-garage',
    name: 'Millender Center / RenCen Garage',
    stationId: 'millender',
    address: '333 E. Renaissance Dr, Detroit, MI',
    coordinate: [-83.0410, 42.3300],
    walkMinutes: 3,
    capacityNote: 'Covered Walkway to Tower Core',
  },
];

// "I'm Going To" Intent Dropdown Venues
export const venueDestinations: VenueDestination[] = [
  {
    id: 'lca',
    name: 'Little Caesars Arena',
    category: 'sports',
    nearestStationId: 'grand-circus',
    coordinate: [-83.0553, 42.3410],
    address: '2645 Woodward Ave, Detroit, MI',
    description: 'Home of the Detroit Red Wings & Detroit Pistons, plus major concert tours.',
  },
  {
    id: 'ford-field',
    name: 'Ford Field',
    category: 'sports',
    nearestStationId: 'broadway',
    coordinate: [-83.0456, 42.3400],
    address: '2000 Brush St, Detroit, MI',
    description: 'Home of the Detroit Lions and massive stadium events.',
  },
  {
    id: 'comerica-park',
    name: 'Comerica Park',
    category: 'sports',
    nearestStationId: 'broadway',
    coordinate: [-83.0485, 42.3390],
    address: '2100 Woodward Ave, Detroit, MI',
    description: 'Home of the Detroit Tigers open-air ballpark.',
  },
  {
    id: 'hart-plaza',
    name: 'Hart Plaza',
    category: 'civic',
    nearestStationId: 'financial',
    coordinate: [-83.0440, 42.3275],
    address: '1 Hart Plaza, Detroit, MI',
    description: 'Iconic riverfront festival grounds hosting Movement, Jazz Fest, and cultural fairs.',
  },
  {
    id: 'campus-martius',
    name: 'Campus Martius Park',
    category: 'civic',
    nearestStationId: 'cadillac',
    coordinate: [-83.0474, 42.3326],
    address: '800 Woodward Ave, Detroit, MI',
    description: 'Detroit’s vibrant central gathering hub with seasonal beach, ice rink, and dining.',
  },
  {
    id: 'grand-circus-park',
    name: 'Grand Circus Park',
    category: 'civic',
    nearestStationId: 'grand-circus',
    coordinate: [-83.0505, 42.3361],
    address: 'Park Ave & Woodward Ave, Detroit, MI',
    description: 'Historic downtown park linking theater district and downtown core.',
  },
  {
    id: 'huntington-place',
    name: 'Huntington Place',
    category: 'convention',
    nearestStationId: 'huntington',
    coordinate: [-83.0490, 42.3270],
    address: '1 Washington Blvd, Detroit, MI',
    description: 'World-class convention center hosting the Detroit Auto Show and major expos.',
  },
  {
    id: 'detroit-opera-house',
    name: 'Detroit Opera House',
    category: 'entertainment',
    nearestStationId: 'broadway',
    coordinate: [-83.0480, 42.3348],
    address: '1526 Broadway St, Detroit, MI',
    description: 'Historic performing arts venue for opera, ballet, and touring concerts.',
  },
];

export const qlineStops: { name: string; coordinate: Coordinate }[] = [
  { name: 'Congress Street', coordinate: [-83.0445, 42.3295] },
  { name: 'Campus Martius', coordinate: [-83.0474, 42.3326] },
  { name: 'Grand Circus', coordinate: [-83.0503, 42.3361] },
  { name: 'Montcalm Street', coordinate: [-83.0534, 42.3395] },
  { name: 'Adelaide / Sproat', coordinate: [-83.0562, 42.3427] },
  { name: 'MLK / Mack', coordinate: [-83.0598, 42.3468] },
  { name: 'Canfield Street', coordinate: [-83.0642, 42.3516] },
  { name: 'Warren Avenue', coordinate: [-83.0658, 42.3575] },
  { name: 'Ferry Street', coordinate: [-83.0667, 42.3615] },
  { name: 'Amsterdam Street', coordinate: [-83.0705, 42.3665] },
  { name: 'Baltimore Street', coordinate: [-83.0725, 42.3695] },
  { name: 'Grand Boulevard', coordinate: [-83.0741, 42.3722] },
];

export const restaurants: Place[] = [
  ['lafayette', 'Lafayette Coney Island', 'Detroit coney dogs', '$', 'https://www.lafayetteconeyisland.com/', -83.0478, 42.3317],
  ['american', 'American Coney Island', 'Detroit coney dogs', '$', 'https://www.americanconeyisland.com/', -83.0480, 42.3318],
  ['parc', 'Parc', 'New American', '$$$', 'https://www.parcdetroit.com/', -83.0467, 42.3318],
  ['central', 'Central Kitchen + Bar', 'American', '$$', 'https://centralkitchendetroit.com/', -83.0463, 42.3324],
  ['chophouse', 'London Chop House', 'Steakhouse', '$$$$', 'https://thelondonchophouse.com/', -83.0466, 42.3308],
  ['checker', 'Checker Bar', 'Burgers & bar', '$', 'https://www.checkerbardetroit.com/', -83.0457, 42.3313],
  ['joemuer', 'Joe Muer Seafood', 'Seafood', '$$$$', 'https://joemuer.com/', -83.0396, 42.3290],
  ['andiamo', 'Andiamo Detroit Riverfront', 'Italian', '$$$', 'https://andiamoitalia.com/', -83.0399, 42.3294],
  ['apparatus', 'The Apparatus Room', 'New American', '$$$', 'https://detroitfoundationhotel.com/eat-drink/', -83.0505, 42.3300],
  ['anchor', 'Anchor Bar', 'Pub & grill', '$$', 'https://www.anchorbardetroit.com/', -83.0520, 42.3313],
  ['lumen', 'Lumen Detroit', 'American', '$$', 'https://www.lumendetroit.com/', -83.0530, 42.3297],
  ['wright', 'Wright & Company', 'Small plates', '$$$', 'https://www.wrightdetroit.com/', -83.0478, 42.3346],
  ['hudson', 'Hudson Café', 'Breakfast & brunch', '$$', 'https://hudsoncafedetroit.com/', -83.0479, 42.3336],
  ['townhouse', 'Townhouse Detroit', 'American', '$$$', 'https://towntownsetroit.com/', -83.0470, 42.3335],
  ['sanmorello', 'San Morello', 'Italian', '$$$', 'https://sanmorello.com/', -83.0487, 42.3356],
  ['mootz', 'Mootz Pizzeria + Bar', 'Pizza', '$$', 'https://mootzpizzeria.com/', -83.0455, 42.3352],
  ['cliffbells', 'Cliff Bell’s', 'Jazz club & dining', '$$$', 'https://www.cliffbells.com/', -83.0533, 42.3358],
  ['bucharest', 'Bucharest Grill', 'Mediterranean', '$', 'https://bucharestgrill.com/', -83.0511, 42.3365],
  ['pegasus', 'Pegasus Taverna', 'Greek', '$$', 'https://pegasustavernas.com/', -83.0426, 42.3354],
  ['fishbones', 'Fishbone’s', 'Seafood & Creole', '$$', 'https://fishbonesusa.com/', -83.0421, 42.3350],
  ['shillelagh', 'The Old Shillelagh', 'Irish pub', '$$', 'https://oldshillelagh.com/', -83.0419, 42.3349],
  ['firebird', 'Firebird Tavern', 'Tavern', '$$', 'https://www.firebirdtavern.com/', -83.0428, 42.3357],
  ['sweetwater', 'Sweetwater Tavern', 'Wings & tavern', '$$', 'https://sweetwatertavern.net/', -83.0413, 42.3335],
].map(([id, name, category, price, url, lng, lat]) => {
  const isLate = ['lafayette', 'american', 'checker', 'shillelagh', 'sweetwater'].includes(id as string);
  const isSponsored = id === 'lafayette';
  
  return {
    id: id as string,
    name: name as string,
    category: category as string,
    price: price as string,
    url: url as string,
    coordinate: [lng as number, lat as number] as Coordinate,
    lateNight: isLate,
    sponsored: isSponsored,
    ...(isSponsored
      ? {
          sponsorTier: 'anchor' as const,
          sponsorTagline: 'Official Downtown Anchor Partner',
          sponsorPerk: 'Show DPM - Go! for 10% off dine-in orders',
          sponsorStationId: 'fort-cass',
        }
      : {}),
  };
});

export function milesBetween(a: Coordinate, b: Coordinate): number {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearbyRestaurants(station: Station) {
  return restaurants
    .map(p => ({ ...p, walkMiles: milesBetween(station.entrance, p.coordinate) * 1.25 }))
    .filter(p => p.walkMiles <= 0.5)
    .sort((a, b) => a.walkMiles - b.walkMiles);
}

export function nearbyParking(stationId: string): ParkingStructure[] {
  return parkingStructures.filter(p => p.stationId === stationId);
}

export const sportsTeams = [
  { id: 'lions', team: 'Detroit Lions', league: 'NFL', venue: 'Ford Field', station: 'Greektown Station', href: 'https://www.detroitlions.com/schedule/' },
  { id: 'tigers', team: 'Detroit Tigers', league: 'MLB', venue: 'Comerica Park', station: 'Broadway Station', href: 'https://www.mlb.com/tigers/schedule' },
  { id: 'redwings', team: 'Detroit Red Wings', league: 'NHL', venue: 'Little Caesars Arena', station: 'Grand Circus Park Station', href: 'https://www.nhl.com/redwings/schedule' },
  { id: 'pistons', team: 'Detroit Pistons', league: 'NBA', venue: 'Little Caesars Arena', station: 'Grand Circus Park Station', href: 'https://www.nba.com/pistons/schedule' },
];

export const activities = [
  { name: 'Campus Martius Park events', area: 'Downtown', note: 'Seasonal public programming, ice rink in winter', station: 'Financial District Station', href: 'https://downtowndetroit.org/events/', downtown: true },
  { name: 'Beacon Park programming', area: 'Downtown', note: 'Free concerts, markets and family events', station: 'Fort / Cass Station', href: 'https://downtowndetroit.org/events/', downtown: true },
  { name: 'Detroit RiverWalk', area: 'Downtown riverfront', note: 'Public riverfront paths and events', station: 'Renaissance Center Station', href: 'https://detroitriverfront.org/events', downtown: true },
  { name: 'Capitol Park', area: 'Downtown', note: 'Public plaza with pop-up events', station: 'Times Square Station', href: 'https://downtowndetroit.org/', downtown: true },
  { name: 'Eastern Market Saturday Market', area: 'Eastern Market', note: 'Outside downtown', station: '', href: 'https://easternmarket.org/', downtown: false },
].filter(a => a.downtown);