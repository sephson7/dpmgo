export type Coordinate = [number, number];

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
    .filter(p => p.walkMiles <= 0.4)
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




// ==========================================
// QUICK NAVIGATION & "HOW DO I?" DATA MODELS
// ==========================================

export type HotelGuide = {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  nearestStationId: string;
  nearestStationName: string;
  nearestLine: 'mover' | 'qline';
  walkingDistanceMiles: number;
  walkingMinutes: number;
  walkingDirections: string;
};

export const popularHotels: HotelGuide[] = [
  {
    id: 'foundation-hotel',
    name: 'Detroit Foundation Hotel',
    address: '250 W Larned St',
    coordinate: [-83.0487, 42.3289],
    nearestStationId: 'fort-cass',
    nearestStationName: 'Fort / Cass Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.15,
    walkingMinutes: 3,
    walkingDirections: 'Exit station north onto Cass Ave, head half a block south to Larned St. Entrance is across from Huntington Place.',
  },
  {
    id: 'westin-book-cadillac',
    name: 'The Westin Book Cadillac Detroit',
    address: '1114 Washington Blvd',
    coordinate: [-83.0504, 42.3323],
    nearestStationId: 'michigan',
    nearestStationName: 'Michigan Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.1,
    walkingMinutes: 2,
    walkingDirections: 'Exit Michigan Station east towards Washington Blvd. The historic hotel tower entrance is 1 block south on Washington Blvd.',
  },
  {
    id: 'courtyard-marriott',
    name: 'Courtyard by Marriott Downtown',
    address: '333 E Jefferson Ave',
    coordinate: [-83.0418, 42.3305],
    nearestStationId: 'millender',
    nearestStationName: 'Millender Center Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.05,
    walkingMinutes: 1,
    walkingDirections: 'Direct indoor climate-controlled skywalk connection from the Millender Center Station platform directly into the hotel lobby.',
  },
  {
    id: 'shinola-hotel',
    name: 'Shinola Hotel',
    address: '1400 Woodward Ave',
    coordinate: [-83.0483, 42.3347],
    nearestStationId: 'broadway',
    nearestStationName: 'Broadway Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.12,
    walkingMinutes: 2,
    walkingDirections: 'Exit Broadway Station west along John R St toward Woodward Ave. Turn left into Parker’s Alley or Woodward entrance.',
  },
  {
    id: 'fort-pontchartrain',
    name: 'Hotel Fort Pontchartrain (Wyndham)',
    address: '2 Washington Blvd',
    coordinate: [-83.0471, 42.3276],
    nearestStationId: 'financial',
    nearestStationName: 'Financial District Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.1,
    walkingMinutes: 2,
    walkingDirections: 'Exit Financial District onto Jefferson Ave and head 1 block south on Washington Blvd toward the river.',
  },
  {
    id: 'hollywood-greektown',
    name: 'Hollywood Casino at Greektown Hotel',
    address: '1200 St Antoine St',
    coordinate: [-83.0425, 42.3352],
    nearestStationId: 'greektown',
    nearestStationName: 'Greektown Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.05,
    walkingMinutes: 1,
    walkingDirections: 'Direct 3rd floor enclosed pedestrian skybridge directly connecting the People Mover station to the casino & hotel atrium.',
  },
  {
    id: 'david-whitney',
    name: 'Hotel David Whitney (Autograph Collection)',
    address: '1 Park Ave',
    coordinate: [-83.0506, 42.3361],
    nearestStationId: 'grand-circus',
    nearestStationName: 'Grand Circus Park Station',
    nearestLine: 'mover',
    walkingDistanceMiles: 0.05,
    walkingMinutes: 1,
    walkingDirections: 'The station entrance sits directly on the Park Ave sidewalk next to the iconic neo-renaissance David Whitney building lobby.',
  },
];

export type CanadaGuide = {
  title: string;
  operator: string;
  terminalName: string;
  terminalAddress: string;
  terminalCoordinate: Coordinate;
  nearestStationId: string;
  nearestStationName: string;
  walkingFromStation: string;
  fareCAD: string;
  fareUSD: string;
  paymentMethod: string;
  documentRequirements: string[];
  scheduleNotes: string;
  serviceHours: string;
  officialWebsite: string;
};

export const canadaTransitGuide: CanadaGuide = {
  title: 'Transit Windsor Tunnel Bus to Canada',
  operator: 'Transit Windsor',
  terminalName: 'Detroit-Windsor Tunnel Bus Terminal (Mariners’ Church Plaza)',
  terminalAddress: '170 E Jefferson Ave & Randolph St, Detroit, MI 48226',
  terminalCoordinate: [-83.0426, 42.3292],
  nearestStationId: 'financial',
  nearestStationName: 'Financial District / Millender Center Stations',
  walkingFromStation: 'Walk 1 block south on Randolph St or Larned St to the Mariners’ Church tunnel plaza boarding platform.',
  fareCAD: '$15.00 – $17.50 CAD one-way',
  fareUSD: 'Credit or debit card accepted on bus (converts automatically)',
  paymentMethod: 'Contactless debit / credit card on bus boarding (no cash needed)',
  documentRequirements: [
    'Valid U.S. or Canadian Passport (or Passport Card)',
    'Enhanced Driver’s License (EDL)',
    'NEXUS / FAST Trusted Traveler Card',
  ],
  scheduleNotes: 'Runs every 60–120 minutes daily directly under the Detroit River to Windsor Transit Terminal (Downtown Windsor).',
  serviceHours: 'Monday – Saturday: 6:00 AM – 11:54 PM | Sunday: 8:00 AM – 7:54 PM',
  officialWebsite: 'https://thelinqtunnelbus.ca/',
};

export type DestinationShortcut = {
  id: string;
  name: string;
  category: 'Sports & Stadium' | 'Entertainment & Arts' | 'Public Park & Civic' | 'Waterfront';
  description: string;
  icon: string;
  coordinate: Coordinate;
  primaryStationId: string;
  primaryStationName: string;
  primaryLine: 'mover' | 'qline';
  secondaryStationId?: string;
  secondaryStationName?: string;
  walkingDistanceMiles: number;
  walkingMinutes: number;
  walkingDirections: string;
  popularEvents: string;
};

export const destinationShortcuts: DestinationShortcut[] = [
  {
    id: 'ford-field',
    name: 'Ford Field',
    category: 'Sports & Stadium',
    description: 'Home of the Detroit Lions & premier stadium concert arena.',
    icon: 'football',
    coordinate: [-83.0446, 42.3400],
    primaryStationId: 'greektown',
    primaryStationName: 'Greektown Station',
    primaryLine: 'mover',
    secondaryStationId: 'broadway',
    secondaryStationName: 'Broadway Station',
    walkingDistanceMiles: 0.28,
    walkingMinutes: 5,
    walkingDirections: 'Exit Greektown Station, walk northeast along Beaubien St or St. Antoine St towards E Adams Ave. Gate G entrance is on Adams.',
    popularEvents: 'Detroit Lions NFL, major stadium world tours, Monster Jam',
  },
  {
    id: 'little-caesars-arena',
    name: 'Little Caesars Arena',
    category: 'Sports & Stadium',
    description: 'Home of the Detroit Red Wings & Detroit Pistons at The District Detroit.',
    icon: 'hockey',
    coordinate: [-83.0552, 42.3411],
    primaryStationId: 'ql-adelaide',
    primaryStationName: 'Sproat / Adelaide Station (QLINE)',
    primaryLine: 'qline',
    secondaryStationId: 'grand-circus',
    secondaryStationName: 'Grand Circus Park Station (DPM Transfer)',
    walkingDistanceMiles: 0.1,
    walkingMinutes: 2,
    walkingDirections: 'The QLINE streetcar stops directly in front of the arena doors along Woodward Ave. Step off directly onto the arena plaza.',
    popularEvents: 'Red Wings NHL, Pistons NBA, arena concerts, UFC',
  },
  {
    id: 'comerica-park',
    name: 'Comerica Park',
    category: 'Sports & Stadium',
    description: 'Home of the Detroit Tigers & open-air downtown ballpark.',
    icon: 'baseball',
    coordinate: [-83.0485, 42.3390],
    primaryStationId: 'broadway',
    primaryStationName: 'Broadway Station',
    primaryLine: 'mover',
    secondaryStationId: 'grand-circus',
    secondaryStationName: 'Grand Circus Park Station',
    walkingDistanceMiles: 0.2,
    walkingMinutes: 4,
    walkingDirections: 'Exit Broadway Station north onto John R St, continue 2 short blocks past Grand Circus Park directly into the Comerica Park outfield gates.',
    popularEvents: 'Detroit Tigers MLB baseball, summer ballpark concert festivals',
  },
  {
    id: 'grand-circus-park',
    name: 'Grand Circus Park',
    category: 'Public Park & Civic',
    description: 'Historic semicircular downtown green space & premier dual-transit interchange.',
    icon: 'trees',
    coordinate: [-83.0506, 42.3358],
    primaryStationId: 'grand-circus',
    primaryStationName: 'Grand Circus Park Station',
    primaryLine: 'mover',
    secondaryStationId: 'ql-grand-circus',
    secondaryStationName: 'Grand Circus (QLINE)',
    walkingDistanceMiles: 0.05,
    walkingMinutes: 1,
    walkingDirections: 'Direct dual-transit hub: step off the People Mover elevated platform and transfer directly to the Woodward QLINE streetcar.',
    popularEvents: 'Theater District dining, Detroit Opera House, historic fountain plaza',
  },
  {
    id: 'campus-martius',
    name: 'Campus Martius Park',
    category: 'Public Park & Civic',
    description: 'Detroit’s official Point of Origin: year-round ice rink, dining, beach & civic concerts.',
    icon: 'sparkles',
    coordinate: [-83.0467, 42.3318],
    primaryStationId: 'cadillac',
    primaryStationName: 'Cadillac Center Station',
    primaryLine: 'mover',
    secondaryStationId: 'ql-campus-martius',
    secondaryStationName: 'Campus Martius (QLINE)',
    walkingDistanceMiles: 0.12,
    walkingMinutes: 2,
    walkingDirections: 'Exit Cadillac Center west towards Woodward Ave. Campus Martius Park, the ice rink, Parc restaurant and monument are right in front of you.',
    popularEvents: 'Winter ice skating rink, summer beach party, Detroit Tree Lighting, live music',
  },
  {
    id: 'hart-plaza',
    name: 'Hart Plaza',
    category: 'Waterfront',
    description: 'Waterfront civic plaza on the Detroit River featuring Dodge Fountain & major music festivals.',
    icon: 'waves',
    coordinate: [-83.0441, 42.3274],
    primaryStationId: 'financial',
    primaryStationName: 'Financial District Station',
    primaryLine: 'mover',
    secondaryStationId: 'renaissance',
    secondaryStationName: 'Renaissance Center Station',
    walkingDistanceMiles: 0.15,
    walkingMinutes: 3,
    walkingDirections: 'Exit Financial District south along Griswold St toward the Detroit River. Hart Plaza amphitheater entrance is on Jefferson Ave.',
    popularEvents: 'Movement Electronic Music Festival, Detroit Jazz Festival, ethnic river festivals',
  },
];

export type HowDoIFlow = {
  id: 'hotel' | 'canada' | 'campus-martius' | 'riverfront';
  title: string;
  badge: string;
  shortDesc: string;
  icon: string;
};

export const howDoIFlows: HowDoIFlow[] = [
  {
    id: 'hotel',
    title: 'Get back to my hotel',
    badge: 'HOTEL WAYFINDING',
    shortDesc: 'Find your downtown hotel & get guided station stops with walking wayfinding.',
    icon: 'hotel',
  },
  {
    id: 'canada',
    title: 'Get to Canada',
    badge: 'BORDER CROSSING',
    shortDesc: 'Official Transit Windsor Tunnel Bus guide, nearest station, and border credentials.',
    icon: 'flag',
  },
  {
    id: 'campus-martius',
    title: 'Get to Campus Martius',
    badge: 'DOWNTOWN CENTER',
    shortDesc: 'Reach the ice rink, central civic plaza, and Woodward Avenue hub.',
    icon: 'park',
  },
  {
    id: 'riverfront',
    title: 'Get to the Riverfront',
    badge: 'WATERWALK & VIEWS',
    shortDesc: 'Access the Detroit RiverWalk, GM RenCen wintergarden, and Cullen Plaza.',
    icon: 'water',
  },
];

export type TransitRoutePlan = {
  originStation: Station;
  destinationStation: Station;
  destinationHubName: string;
  line: 'mover' | 'qline';
  stopsCount: number;
  estimatedRideMinutes: number;
  intermediateStations: string[];
  walkingDistanceMiles: number;
  walkingMinutes: number;
  walkingDirections: string;
  targetCoordinate: Coordinate;
  cameraTilt: {
    center: Coordinate;
    zoom: number;
    pitch: number;
    bearing: number;
  };
};

/**
 * Flexible Boarding Routing Engine
 * Automatically determines optimal boarding station using user GPS (if available)
 * or a chosen starting point, and computes exact transit steps, stops, and walking times.
 */
export function calculateFlexibleRoute({
  userCoordinate,
  manualOriginStationId,
  targetDestination,
}: {
  userCoordinate?: Coordinate | null;
  manualOriginStationId?: string | null;
  targetDestination: DestinationShortcut | HotelGuide | CanadaGuide | Station;
}): TransitRoutePlan {
  // Determine target station and coordinates
  let destinationStationId: string;
  let targetHubName: string;
  let walkMiles = 0.15;
  let walkMin = 3;
  let walkDirections = 'Proceed to destination exit.';
  let targetCoord: Coordinate = [-83.0458, 42.3314];

  if ('nearestStationId' in targetDestination) {
    const guide = targetDestination as HotelGuide | CanadaGuide;
    destinationStationId = guide.nearestStationId;
    
    targetHubName = ('name' in guide && guide.name) 
      ? guide.name! 
      : ('title' in guide && guide.title) 
      ? guide.title! 
      : 'Destination';
      
    walkMiles = ('walkingDistanceMiles' in guide && guide.walkingDistanceMiles !== undefined)
      ? guide.walkingDistanceMiles! 
      : 0.15;
      
    walkMin = ('walkingMinutes' in guide && guide.walkingMinutes !== undefined) 
      ? guide.walkingMinutes! 
      : 3;
      
    walkDirections = ('walkingDirections' in guide && guide.walkingDirections) 
      ? guide.walkingDirections! 
      : ('walkingFromStation' in guide && guide.walkingFromStation) 
      ? guide.walkingFromStation! 
      : 'Proceed to destination exit.';
      
    targetCoord = ('coordinate' in guide && guide.coordinate) 
      ? guide.coordinate! 
      : ('terminalCoordinate' in guide && guide.terminalCoordinate) 
      ? guide.terminalCoordinate! 
      : [-83.0458, 42.3314];
      
  } else if ('primaryStationId' in targetDestination) {
    const shortcut = targetDestination as DestinationShortcut;
    destinationStationId = shortcut.primaryStationId;
    targetHubName = shortcut.name;
    walkMiles = shortcut.walkingDistanceMiles;
    walkMin = shortcut.walkingMinutes;
    walkDirections = shortcut.walkingDirections;
    targetCoord = shortcut.coordinate;
  } else {
    const station = targetDestination as Station;
    destinationStationId = station.id;
    targetHubName = station.name;
    targetCoord = station.coordinate;
    walkMiles = 0.05;
    walkMin = 1;
    walkDirections = station.entranceNotes || 'Platform elevator and stairs connect directly to street level.';
  }

  // Guaranteed fallback default station
  const defaultStation: Station = (peopleMoverStations[0] || allTransitStations[0])!;
  const destinationStation: Station =
    (allTransitStations.find(s => s.id === destinationStationId) || defaultStation)!;

  // Determine Origin Station: Manual override > User GPS nearest > Loop start
  let originStation: Station;
  if (manualOriginStationId) {
    originStation = (allTransitStations.find(s => s.id === manualOriginStationId) || defaultStation)!;
  } else if (userCoordinate) {
    const sameLinePool = destinationStation.line === 'qline' ? qlineStations : peopleMoverStations;
    const poolToUse = sameLinePool.length > 0 ? sameLinePool : allTransitStations;
    const sorted = [...poolToUse].sort(
      (a, b) => milesBetween(userCoordinate, a.coordinate) - milesBetween(userCoordinate, b.coordinate)
    );
    originStation = (sorted[0] || defaultStation)!;
  } else {
    const sameLinePool = destinationStation.line === 'qline' ? qlineStations : peopleMoverStations;
    originStation = (sameLinePool[0] || defaultStation)!;
  }

  const isQLine = destinationStation.line === 'qline' || originStation.line === 'qline';
  let stopsCount = 0;
  let intermediate: string[] = [];

  if (!isQLine) {
    // People Mover clockwise loop calculation
    const fromIdx = peopleMoverStations.findIndex(s => s.id === originStation.id);
    const toIdx = peopleMoverStations.findIndex(s => s.id === destinationStation.id);

    if (fromIdx !== -1 && toIdx !== -1) {
      if (toIdx >= fromIdx) {
        stopsCount = toIdx - fromIdx;
        intermediate = peopleMoverStations.slice(fromIdx + 1, toIdx).map(s => s.name);
      } else {
        stopsCount = peopleMoverStations.length - fromIdx + toIdx;
        const leg1 = peopleMoverStations.slice(fromIdx + 1).map(s => s.name);
        const leg2 = peopleMoverStations.slice(0, toIdx).map(s => s.name);
        intermediate = [...leg1, ...leg2];
      }
    }
  } else {
    // QLINE corridor calculation
    const fromIdx = qlineStations.findIndex(s => s.id === originStation.id);
    const toIdx = qlineStations.findIndex(s => s.id === destinationStation.id);
    if (fromIdx !== -1 && toIdx !== -1) {
      stopsCount = Math.abs(toIdx - fromIdx);
      const step = toIdx > fromIdx ? 1 : -1;
      for (let i = fromIdx + step; i !== toIdx; i += step) {
        const qStation = qlineStations[i];
        if (qStation) intermediate.push(qStation.name);
      }
    }
  }

  const estimatedRideMinutes = Math.max(1, Math.round(stopsCount * (isQLine ? 2.5 : 2.0)));

  const resultPlan: TransitRoutePlan = {
    originStation,
    destinationStation,
    destinationHubName: targetHubName,
    line: isQLine ? 'qline' : 'mover',
    stopsCount,
    estimatedRideMinutes,
    intermediateStations: intermediate,
    walkingDistanceMiles: walkMiles,
    walkingMinutes: walkMin,
    walkingDirections: walkDirections,
    targetCoordinate: targetCoord,
    cameraTilt: {
      center: targetCoord,
      zoom: 17.2,
      pitch: 58,
      bearing: -15,
    },
  };

  return resultPlan;
}