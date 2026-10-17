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
  lateNight?: boolean;
  sponsored?: boolean;
  sponsorTier?: 'anchor' | 'featured';
  sponsorTagline?: string;
  sponsorPerk?: string;
  sponsorStationId?: string;
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
  line?: 'mover' | 'qline';
};

// ==========================================
// DETROIT PEOPLE MOVER (13 Loop Stations)
// Verified against official DTC GTFS stops & shape
// ==========================================
export const peopleMoverStations: Station[] = [
  {
    id: 'michigan',
    name: 'Michigan Station',
    coordinate: [-83.05212, 42.331363],
    entrance: [-83.052151, 42.331464],
    neighborhood: 'West Downtown',
    crossStreets: 'Michigan Ave & Cass Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Street elevator and escalator lobby located on south side of Michigan Ave.',
    restaurants: [],
    line: 'mover',
  },
  {
    id: 'fort-cass',
    name: 'Fort / Cass Station',
    coordinate: [-83.05115, 42.329505],
    entrance: [-83.051032, 42.329415],
    neighborhood: 'West Downtown',
    crossStreets: 'Fort St & Cass Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Elevator entrance accessible from northeast corner of Fort St.',
    restaurants: [],
    line: 'mover',
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
    line: 'mover',
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
    line: 'mover',
  },
  {
    id: 'financial',
    name: 'Financial District Station',
    coordinate: [-83.046691, 42.32868],
    entrance: [-83.046507, 42.328756],
    neighborhood: 'Financial District',
    crossStreets: 'Larned St & Griswold St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Entrance at 150 W Jefferson building; elevator available via lower concourse.',
    restaurants: [],
    line: 'mover',
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
    line: 'mover',
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
    line: 'mover',
  },
  {
    id: 'bricktown',
    name: 'Bricktown Station',
    coordinate: [-83.041194, 42.333326],
    entrance: [-83.041262, 42.333473],
    neighborhood: 'Bricktown',
    crossStreets: 'E Fort St & Beaubien St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Station entrance facing Beaubien St across from historic St. Mary church.',
    restaurants: [],
    line: 'mover',
  },
  {
    id: 'greektown',
    name: 'Greektown Station',
    coordinate: [-83.042419, 42.334617],
    entrance: [-83.04232, 42.334693],
    neighborhood: 'Greektown',
    crossStreets: 'Monroe St & Beaubien St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Direct connection to Hollywood Casino at Greektown 3rd floor bridge.',
    restaurants: [],
    line: 'mover',
  },
  {
    id: 'cadillac',
    name: 'Cadillac Center Station',
    coordinate: [-83.046157, 42.33371],
    entrance: [-83.04633, 42.333644],
    neighborhood: 'Downtown Core',
    crossStreets: 'Gratiot Ave & Library St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Ground entrance at Library St & Gratiot Ave near Skillman Library.',
    restaurants: [],
    line: 'mover',
  },
  {
    id: 'broadway',
    name: 'Broadway Station',
    coordinate: [-83.048213, 42.335449],
    entrance: [-83.048179, 42.335569],
    neighborhood: 'Theater District',
    crossStreets: 'Broadway St & John R St',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Broadway street-level lobby with elevator serving both platform sides.',
    restaurants: [],
    line: 'mover',
  },
  {
    id: 'grand-circus',
    name: 'Grand Circus Park Station',
    coordinate: [-83.050592, 42.335782],
    entrance: [-83.050629, 42.335804],
    neighborhood: 'Entertainment District',
    crossStreets: 'Park Ave & Woodward Ave',
    elevator: true,
    adaCompliant: true,
    entranceNotes: 'Street entrance on Park Ave; direct transfer link to QLINE Woodward corridor.',
    restaurants: [],
    line: 'mover',
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
    line: 'mover',
  },
];

// ==========================================
// QLINE STREETCAR (12 Woodward Ave Stations)
// Verified along Woodward Avenue corridor centerline
// ==========================================
export const qlineStations: Station[] = [
  {
    id: 'ql-congress',
    name: 'Congress Street',
    coordinate: [-83.04554, 42.32979],
    entrance: [-83.04554, 42.32979],
    neighborhood: 'Financial District',
    crossStreets: 'Woodward Ave & Congress St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Street-level platform in median of Woodward Ave.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-campus-martius',
    name: 'Campus Martius',
    coordinate: [-83.0474, 42.33238],
    entrance: [-83.0474, 42.33238],
    neighborhood: 'Downtown Core',
    crossStreets: 'Woodward Ave & Michigan Ave',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Median platform directly adjacent to Campus Martius Park.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-grand-circus',
    name: 'Grand Circus',
    coordinate: [-83.05042, 42.33634],
    entrance: [-83.05042, 42.33634],
    neighborhood: 'Grand Circus Park',
    crossStreets: 'Woodward Ave & Park Ave',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Transfer point to Detroit People Mover Grand Circus Station.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-montcalm',
    name: 'Montcalm Street',
    coordinate: [-83.05232, 42.33914],
    entrance: [-83.05232, 42.33914],
    neighborhood: 'Foxtown / Entertainment',
    crossStreets: 'Woodward Ave & Montcalm St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Directly adjacent to Fox Theatre and south concourse of Little Caesars Arena.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-adelaide',
    name: 'Sproat / Adelaide',
    coordinate: [-83.05397, 42.34156],
    entrance: [-83.05397, 42.34156],
    neighborhood: 'Brush Park / LCA',
    crossStreets: 'Woodward Ave & Adelaide St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Direct pedestrian access into historic Brush Park and LCA main entrance.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-mlk',
    name: 'Mack / MLK Jr. Blvd',
    coordinate: [-83.05773, 42.34716],
    entrance: [-83.05773, 42.34716],
    neighborhood: 'Midtown South',
    crossStreets: 'Woodward Ave & MLK Jr Blvd',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Near Whole Foods Market and Detroit Medical Center campus connectors.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-canfield',
    name: 'Canfield Street',
    coordinate: [-83.06133, 42.35251],
    entrance: [-83.06133, 42.35251],
    neighborhood: 'Midtown Commercial',
    crossStreets: 'Woodward Ave & Canfield St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Heart of Midtown retail, dining corridor, and south Wayne State campus.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-warren',
    name: 'Warren Avenue',
    coordinate: [-83.0645, 42.35713],
    entrance: [-83.0645, 42.35713],
    neighborhood: 'Cultural Center',
    crossStreets: 'Woodward Ave & Warren Ave',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Direct access to Detroit Institute of Arts and Detroit Public Library.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-ferry',
    name: 'Ferry Street',
    coordinate: [-83.06713, 42.36105],
    entrance: [-83.06713, 42.36105],
    neighborhood: 'Cultural Center North',
    crossStreets: 'Woodward Ave & Ferry St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Near Detroit Historical Museum and College for Creative Studies.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-amsterdam',
    name: 'Amsterdam Street',
    coordinate: [-83.07068, 42.36623],
    entrance: [-83.07068, 42.36623],
    neighborhood: 'New Center South',
    crossStreets: 'Woodward Ave & Amsterdam St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Direct connection to TechTown Detroit innovation hub.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-baltimore',
    name: 'Baltimore Street',
    coordinate: [-83.07231, 42.36872],
    entrance: [-83.07231, 42.36872],
    neighborhood: 'New Center / Amtrak',
    crossStreets: 'Woodward Ave & Baltimore St',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Primary connection to Detroit Amtrak passenger rail terminal.',
    restaurants: [],
    line: 'qline',
  },
  {
    id: 'ql-grand-blvd',
    name: 'Grand Boulevard',
    coordinate: [-83.07354, 42.37061],
    entrance: [-83.07354, 42.37061],
    neighborhood: 'New Center Terminal',
    crossStreets: 'Woodward Ave & W Grand Blvd',
    elevator: false,
    adaCompliant: true,
    entranceNotes: 'Northern terminus. Serves the Fisher Building and State of Michigan Cadillac Place.',
    restaurants: [],
    line: 'qline',
  },
];

export const qlineStops = qlineStations.map(s => ({ name: s.name, coordinate: s.coordinate }));
export const allTransitStations: Station[] = [...peopleMoverStations, ...qlineStations];

const anchorSponsorRegistry: Record<string, { tier: 'anchor'; tagline: string; perk: string; stationId: string }> = {
  lafayette: {
    tier: 'anchor',
    tagline: 'Official Downtown Anchor Partner',
    perk: 'Show DPM - Go! for 10% off dine-in orders',
    stationId: 'fort-cass',
  },
  'brushpark-brunch': {
    tier: 'anchor',
    tagline: 'Official Brush Park Anchor Partner',
    perk: 'Show DPM - Go! for 10% off weekday brunch entrees',
    stationId: 'ql-adelaide',
  },
};

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
  ['townhouse', 'Townhouse Detroit', 'American', '$$$', 'https://townhousedetroit.com/', -83.0470, 42.3335],
  ['sanmorello', 'San Morello', 'Italian', '$$$', 'https://sanmorello.com/', -83.0487, 42.3356],
  ['mootz', 'Mootz Pizzeria + Bar', 'Pizza', '$$', 'https://mootzpizzeria.com/', -83.0455, 42.3352],
  ['cliffbells', 'Cliff Bell’s', 'Jazz club & dining', '$$$', 'https://www.cliffbells.com/', -83.0533, 42.3358],
  ['bucharest', 'Bucharest Grill', 'Mediterranean', '$', 'https://bucharestgrill.com/', -83.0511, 42.3365],
  ['pegasus', 'Pegasus Taverna', 'Greek', '$$', 'https://pegasustavernas.com/', -83.0426, 42.3354],
  ['fishbones', 'Fishbone’s', 'Seafood & Creole', '$$', 'https://fishbonesusa.com/', -83.0421, 42.3350],
  ['shillelagh', 'The Old Shillelagh', 'Irish pub', '$$', 'https://oldshillelagh.com/', -83.0419, 42.3349],
  ['firebird', 'Firebird Tavern', 'Tavern', '$$', 'https://www.firebirdtavern.com/', -83.0428, 42.3357],
  ['sweetwater', 'Sweetwater Tavern', 'Wings & tavern', '$$', 'https://sweetwatertavern.net/', -83.0413, 42.3335],
  ['brushpark-brunch', 'Brush Park Brunch', 'Brunch & Café', '$$', 'https://www.brushparkbrunch.com/', -83.0558, 42.3438],
  ['grey-ghost', 'Grey Ghost Detroit', 'Steak & Cocktails', '$$$', 'https://greyghostdetroit.com/', -83.0567, 42.3444],
  ['bar-pigalle', 'Bar Pigalle', 'French Bistro', '$$$', 'https://www.barpigalle.com/', -83.0549, 42.3431],
  ['bodega', 'Bodega Market & Café', 'Deli & Bodega', '$', 'https://bodegamkt.com/', -83.0561, 42.3419],
  ['jolly-pumpkin', 'Jolly Pumpkin Pizzeria', 'Pizza & Brewery', '$$', 'https://www.jollypumpkin.com/', -83.0645, 42.3524],
  ['chartreuse', 'Chartreuse Kitchen', 'Farm-to-Table', '$$$', 'https://chartreusekc.com/', -83.0655, 42.3582],
  ['whitney', 'The Whitney', 'Historic American', '$$$$', 'https://thewhitney.com/', -83.0628, 42.3533],
  ['baobab-fare', 'Baobab Fare', 'East African', '$$', 'https://baobabfare.com/', -83.0746, 42.3720],
  ['marrow', 'Marrow Detroit Provisions', 'Gastropub & Butcher', '$$$', 'https://www.marrowdetroit.com/', -83.0735, 42.3715],
].map(([id, name, category, price, url, lng, lat]) => {
  const isLate = ['lafayette', 'american', 'checker', 'shillelagh', 'sweetwater', 'grey-ghost'].includes(id as string);
  const sponsor = anchorSponsorRegistry[id as string];

  return {
    id: id as string,
    name: name as string,
    category: category as string,
    price: price as string,
    url: url as string,
    coordinate: [lng as number, lat as number] as Coordinate,
    lateNight: isLate,
    sponsored: Boolean(sponsor),
    ...(sponsor
      ? {
          sponsorTier: sponsor.tier,
          sponsorTagline: sponsor.tagline,
          sponsorPerk: sponsor.perk,
          sponsorStationId: sponsor.stationId,
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
    .filter(p => p.walkMiles <= 0.6)
    .sort((a, b) => a.walkMiles - b.walkMiles);
}

export const sportsTeams = [
  { id: 'lions', team: 'Detroit Lions', league: 'NFL', venue: 'Ford Field', station: 'Greektown Station', href: 'https://www.detroitlions.com/schedule/' },
  { id: 'tigers', team: 'Detroit Tigers', league: 'MLB', venue: 'Comerica Park', station: 'Broadway Station', href: 'https://www.mlb.com/tigers/schedule' },
  { id: 'redwings', team: 'Detroit Red Wings', league: 'NHL', venue: 'Little Caesars Arena', station: 'Sproat / Adelaide (QLINE) · Grand Circus (DPM)', href: 'https://www.nhl.com/redwings/schedule' },
  { id: 'pistons', team: 'Detroit Pistons', league: 'NBA', venue: 'Little Caesars Arena', station: 'Sproat / Adelaide (QLINE) · Grand Circus (DPM)', href: 'https://www.nba.com/pistons/schedule' },
];

export const activities = [
  { name: 'Campus Martius Park events', area: 'Downtown', note: 'Seasonal public programming, ice rink in winter', station: 'Campus Martius (QLINE) / Financial District (DPM)', href: 'https://downtowndetroit.org/events/', downtown: true },
  { name: 'Beacon Park programming', area: 'Downtown', note: 'Free concerts, night markets and food trucks', station: 'Fort / Cass Station', href: 'https://downtowndetroit.org/events/', downtown: true },
  { name: 'Detroit RiverWalk', area: 'Downtown riverfront', note: 'Public riverfront paths and conservatory', station: 'Renaissance Center Station', href: 'https://detroitriverfront.org/events', downtown: true },
  { name: 'Brush Park Historic Walking District', area: 'Brush Park', note: 'Historic Victorians and boutique café corridor', station: 'Sproat / Adelaide (QLINE)', href: 'https://downtowndetroit.org/', downtown: true },
  { name: 'Detroit Institute of Arts (DIA)', area: 'Midtown Cultural Center', note: 'World-class museum free to MI residents', station: 'Warren Avenue (QLINE)', href: 'https://dia.org/', downtown: true },
  { name: 'Capitol Park', area: 'Downtown', note: 'Public green plaza with pop-up events', station: 'Times Square Station', href: 'https://downtowndetroit.org/', downtown: true },
].filter(a => a.downtown);
