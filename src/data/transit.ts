export type Coordinate = [number, number];
export { peopleMoverShape } from './peopleMoverShape';

export type TransitLine = 'mover' | 'qline';

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
  /** Slot the place holds in the station drawer. */
  sponsorSlot?: 1 | 2;
  /** Rotation window for slot 2 placements. */
  sponsorRotation?: string;
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
  line: TransitLine;
};

// ==========================================
// DETROIT PEOPLE MOVER (13 Loop Stations)
// Verified against official DTC GTFS stops & shape
// ==========================================
// Non-empty tuple types keep the first station addressable without an
// undefined check while staying assignable to Station[] for consumers.
// The loop runs in a single counter-clockwise direction. Station order follows
// the agency GTFS shape (qo5n), which starts at Times Square:
// Times Square -> Michigan -> Fort/Cass -> Huntington -> Water Square ->
// Financial -> Millender -> Renaissance -> Bricktown -> Greektown ->
// Cadillac Center -> Broadway -> Grand Circus Park -> back to Times Square.
export const peopleMoverStations: [Station, ...Station[]] = [
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
];

// ==========================================
// QLINE STREETCAR (12 Woodward Ave Stations)
// Verified along Woodward Avenue corridor centerline
// ==========================================
export const qlineStations: [Station, ...Station[]] = [
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
    entranceNotes:
      'Northern terminus. Serves the Fisher Building and State of Michigan Cadillac Place.',
    restaurants: [],
    line: 'qline',
  },
];

export const allTransitStations: Station[] = [...peopleMoverStations, ...qlineStations];

const stationsById = new Map<string, Station>(
  allTransitStations.map((station) => [station.id, station]),
);

/** Look up any People Mover or QLINE station by id. */
export function findStation(id: string | null | undefined): Station | undefined {
  return id ? stationsById.get(id) : undefined;
}

/**
 * Station slot architecture. Every station drawer has exactly two sponsor
 * slots: slot 1 is an annual partnership and slot 2 rotates between
 * featured partners. A place can only occupy one slot at a time.
 */
export type StationSlotKind = 'annual' | 'rotating';

export type StationSlot = {
  stationId: string;
  slot: 1 | 2;
  kind: StationSlotKind;
  /** Restaurant id that occupies the slot. */
  placeId: string;
  /** Display name, used when the slot is assigned from the partner portal. */
  businessName?: string;
  tagline: string;
  perk: string;
  /** Rotation window for slot 2, e.g. "Q4 2026". */
  rotation?: string;
};

// Slot 1 of Fort / Cass is held by Lafayette Coney Island. Every other slot is
// open and shows the "Claim Slot" call to action until an admin assigns it.
const ANNUAL_SLOTS: StationSlot[] = [
  {
    stationId: 'fort-cass',
    slot: 1,
    kind: 'annual',
    placeId: 'lafayette',
    tagline: 'Official Downtown Anchor Partner',
    perk: 'Show DPM - Go! for 10% off dine-in orders',
  },
];

// Slot 2 rotates between featured partners. Slots that are not listed here are
// open and show the "Claim Slot" call to action in the station drawer.
const ROTATING_SLOTS: StationSlot[] = [];

export const stationSlots: StationSlot[] = [...ANNUAL_SLOTS, ...ROTATING_SLOTS];

const slotByPlaceId = new Map<string, StationSlot>(
  stationSlots.map((slot) => [slot.placeId, slot]),
);

/** The two sponsor slots of a station drawer. */
export function stationSlotAssignments(stationId: string): {
  slot1: StationSlot | null;
  slot2: StationSlot | null;
} {
  return {
    slot1: stationSlots.find((s) => s.stationId === stationId && s.slot === 1) ?? null,
    slot2: stationSlots.find((s) => s.stationId === stationId && s.slot === 2) ?? null,
  };
}

const LATE_NIGHT_PLACE_IDS = new Set([
  'lafayette',
  'american',
  'checker',
  'shillelagh',
  'sweetwater',
  'grey-ghost',
]);

type RestaurantSeed = readonly [
  id: string,
  name: string,
  category: string,
  price: string,
  url: string,
  lng: number,
  lat: number,
];

const restaurantSeeds: RestaurantSeed[] = [
  [
    'lafayette',
    'Lafayette Coney Island',
    'Detroit coney dogs',
    '$',
    'https://places.singleplatform.com/lafayette-coney-island/menu',
    -83.0478,
    42.3317,
  ],
  [
    'american',
    'American Coney Island',
    'Detroit coney dogs',
    '$',
    'https://www.americanconeyisland.com/',
    -83.048,
    42.3318,
  ],
  ['parc', 'Parc', 'New American', '$$$', 'https://www.parcdetroit.com/', -83.0467, 42.3318],
  [
    'central',
    'Central Kitchen + Bar',
    'American',
    '$$',
    'https://centralkitchendetroit.com/',
    -83.0463,
    42.3324,
  ],
  [
    'chophouse',
    'London Chop House',
    'Steakhouse',
    '$$$$',
    'https://thelondonchophouse.com/',
    -83.0466,
    42.3308,
  ],
  [
    'checker',
    'Checker Bar',
    'Burgers & bar',
    '$',
    'https://www.checkerbar.com/',
    -83.0457,
    42.3313,
  ],
  ['joemuer', 'Joe Muer Seafood', 'Seafood', '$$$$', 'https://joemuer.com/', -83.0396, 42.329],
  [
    'andiamo',
    'Andiamo Detroit Riverfront',
    'Italian',
    '$$$',
    'https://andiamoitalia.com/',
    -83.0399,
    42.3294,
  ],
  [
    'apparatus',
    'The Apparatus Room',
    'New American',
    '$$$',
    'https://detroitfoundationhotel.com/dine/apparatus-room/',
    -83.0505,
    42.33,
  ],
  [
    'anchor',
    'Anchor Bar',
    'Pub & grill',
    '$$',
    'https://www.anchorbardetroit.com/',
    -83.052,
    42.3313,
  ],
  ['lumen', 'Lumen Detroit', 'American', '$$', 'https://www.lumendetroit.com/', -83.053, 42.3297],
  [
    'wright',
    'Wright & Company',
    'Small plates',
    '$$$',
    'https://www.wrightdetroit.com/',
    -83.0478,
    42.3346,
  ],
  [
    'hudson',
    'Hudson Café',
    'Breakfast & brunch',
    '$$',
    'https://hudson-cafe.com/',
    -83.0479,
    42.3336,
  ],
  [
    'townhouse',
    'Townhouse Detroit',
    'American',
    '$$$',
    'https://townhousedetroit.com/',
    -83.047,
    42.3335,
  ],
  ['sanmorello', 'San Morello', 'Italian', '$$$', 'https://sanmorello.com/', -83.0487, 42.3356],
  ['mootz', 'Mootz Pizzeria + Bar', 'Pizza', '$$', 'https://mootzpizzeria.com/', -83.0455, 42.3352],
  [
    'cliffbells',
    'Cliff Bell’s',
    'Jazz club & dining',
    '$$$',
    'https://www.cliffbells.com/',
    -83.0533,
    42.3358,
  ],
  [
    'bucharest',
    'Bucharest Grill',
    'Mediterranean',
    '$',
    'https://bucharestgrill.com/',
    -83.0511,
    42.3365,
  ],
  ['pegasus', 'Pegasus Taverna', 'Greek', '$$', 'https://pegasustavernas.com/', -83.0426, 42.3354],
  [
    'fishbones',
    'Fishbone’s',
    'Seafood & Creole',
    '$$',
    'https://fishbonesusa.com/',
    -83.0421,
    42.335,
  ],
  [
    'shillelagh',
    'The Old Shillelagh',
    'Irish pub',
    '$$',
    'https://oldshillelagh.com/',
    -83.0419,
    42.3349,
  ],
  [
    'firebird',
    'Firebird Tavern',
    'Tavern',
    '$$',
    'https://www.firebirdtavern.com/',
    -83.0428,
    42.3357,
  ],
  [
    'sweetwater',
    'Sweetwater Tavern',
    'Wings & tavern',
    '$$',
    'https://sweetwatertavern.net/',
    -83.0413,
    42.3335,
  ],
  // Water Square Café by Say Grace Collective, inside the Residences at
  // Water Square, 222 3rd Ave, on the Detroit Riverfront.
  [
    'water-square-cafe',
    'Water Square Café',
    'Specialty coffee',
    '$',
    'https://say-grace-llc.square.site/',
    -83.0519403,
    42.3248116,
  ],
  [
    'brushpark-brunch',
    'Brush Park Brunch',
    'Brunch & Café',
    '$$',
    'https://www.brushparkbrunch.com/',
    -83.0558,
    42.3438,
  ],
  [
    'grey-ghost',
    'Grey Ghost Detroit',
    'Steak & Cocktails',
    '$$$',
    'https://greyghostdetroit.com/',
    -83.0567,
    42.3444,
  ],
  [
    'bar-pigalle',
    'Bar Pigalle',
    'French Bistro',
    '$$$',
    'https://www.barpigalle.com/',
    -83.0549,
    42.3431,
  ],
  [
    'bodega',
    'Bodega Market & Café',
    'Deli & Bodega',
    '$',
    'https://bodegamkt.com/',
    -83.0561,
    42.3419,
  ],
  [
    'jolly-pumpkin',
    'Jolly Pumpkin Pizzeria',
    'Pizza & Brewery',
    '$$',
    'https://www.jollypumpkin.com/',
    -83.0645,
    42.3524,
  ],
  [
    'chartreuse',
    'Chartreuse Kitchen',
    'Farm-to-Table',
    '$$$',
    'https://chartreusekc.com/',
    -83.0655,
    42.3582,
  ],
  [
    'whitney',
    'The Whitney',
    'Historic American',
    '$$$$',
    'https://thewhitney.com/',
    -83.0628,
    42.3533,
  ],
  ['baobab-fare', 'Baobab Fare', 'East African', '$$', 'https://baobabfare.com/', -83.0746, 42.372],
  [
    'marrow',
    'Marrow Detroit Provisions',
    'Gastropub & Butcher',
    '$$$',
    'https://www.marrowdetroit.com/',
    -83.0735,
    42.3715,
  ],
];

/**
 * Brand images each venue publishes on its own official website (its logo,
 * app icon or social share photo), checked October 2026. Venues not listed
 * publish nothing usable and keep the local image or their site icon.
 * A partner who sends their own photo replaces their entry here.
 */
export const venueBrandImages: Record<string, string> = {
  andiamo:
    'https://andiamoitalia.com/wp-content/uploads/2021/01/cropped-logo-detroits-italian-180x180.png',
  apparatus:
    'https://detroitfoundationhotel.com/wp-content/uploads/2024/07/cropped-detroit-foundation-logo.png',
  'baobab-fare':
    'https://baobabfare.com/wp-content/uploads/2023/01/cropped-baobabfare-fav-180x180.jpeg',
  'bar-pigalle':
    'https://static1.squarespace.com/static/65cfbb3c98696e51f9e8bc30/t/65cfbb4098696e51f9e8bc9f/1706466815938/BarPigalleLogoWhite.png?format=500w',
  bodega: 'https://bodegamkt.com/img/meta-thumb.jpg',
  'brushpark-brunch': 'https://brushparkbrunch.com/wp-content/uploads/2026/05/IMG_4142.jpg',
  chophouse: 'https://www.thelondonchophouse.com/wp-content/uploads/2021/06/LCH-flav.02.png',
  cliffbells:
    'https://cliffbells.com/wp-content/uploads/2023/09/cropped-cliff-bells-favicon-180x180.png',
  fishbones: 'https://fishbonesusa.com/wp-content/uploads/2022/03/FB-Script_22-white.png',
  'grey-ghost': 'https://greyghostdetroit.com/wp-content/uploads/2021/05/black-logo.png',
  joemuer:
    'https://joemuer.com/wp-content/uploads/2020/12/cropped-jm-favicon-192x192-1-180x180.png',
  lumen:
    'https://static1.squarespace.com/static/61e8a000095e8e461a873ccf/t/61f2cbcddcb5ba34467e592d/1643301837696/LUMEN+FULL+LOGO+web-01.png?format=500w',
  mootz: 'https://static.spotapps.co/web/mootzpizzeria--com/apple-touch-icon.png',
  parc: 'https://parcdetroit.com/wp-content/uploads/2025/10/parc-logo-1.webp',
  pegasus:
    'https://static1.squarespace.com/static/600b48ccf635e029087e792c/t/60229828d9e5491492073d82/1612879915151/PEGASUS_LOGO.png?format=500w',
  sanmorello:
    'https://images.getbento.com/UGOi7TqySxy9eeiaIcka_O1pSIMjGTa91IvpYzQ93_logo.png?w=600&fit=fill&auto=compress,format&cs=origin&h=600&bg=413d30&pad=100',
  shillelagh: 'https://oldshillelagh.com/wp-content/uploads/2023/08/Old-Shillelagh-logo.jpg',
  townhouse: 'https://townhousedetroit.com/wp-content/uploads/2025/12/social-share-townhouse.jpg',
  whitney:
    'https://static1.squarespace.com/static/6446b6f97b2cff4196401bb3/t/6446ba3e14ddb21aea8fbd4f/1768591015985/The-whiteny.png?format=500w',
};

export const restaurants: Place[] = restaurantSeeds.map(
  ([id, name, category, price, url, lng, lat]) => {
    // A place is a partner only while it holds a station slot.
    const slot = slotByPlaceId.get(id);

    return {
      id,
      name,
      category,
      price,
      url,
      coordinate: [lng, lat],
      lateNight: LATE_NIGHT_PLACE_IDS.has(id),
      sponsored: Boolean(slot),
      ...(slot
        ? {
            sponsorTier: slot.slot === 1 ? ('anchor' as const) : ('featured' as const),
            sponsorTagline: slot.tagline,
            sponsorPerk: slot.perk,
            sponsorStationId: slot.stationId,
            sponsorSlot: slot.slot,
            ...(slot.rotation ? { sponsorRotation: slot.rotation } : {}),
          }
        : {}),
    };
  },
);

export function milesBetween(a: Coordinate, b: Coordinate): number {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type NearbyPlace = Place & { walkMiles: number };

export function nearbyRestaurants(station: Station): NearbyPlace[] {
  return restaurants
    .map((p) => ({ ...p, walkMiles: milesBetween(station.entrance, p.coordinate) * 1.25 }))
    .filter((p) => p.walkMiles <= 0.4)
    .sort((a, b) => a.walkMiles - b.walkMiles);
}

export const sportsTeams = [
  {
    id: 'lions',
    team: 'Detroit Lions',
    league: 'NFL',
    venue: 'Ford Field',
    station: 'Greektown Station',
    href: 'https://www.detroitlions.com/schedule/',
  },
  {
    id: 'tigers',
    team: 'Detroit Tigers',
    league: 'MLB',
    venue: 'Comerica Park',
    station: 'Broadway Station',
    href: 'https://www.mlb.com/tigers/schedule',
  },
  {
    id: 'redwings',
    team: 'Detroit Red Wings',
    league: 'NHL',
    venue: 'Little Caesars Arena',
    station: 'Sproat / Adelaide (QLINE) · Grand Circus (DPM)',
    href: 'https://www.nhl.com/redwings/schedule',
  },
  {
    id: 'pistons',
    team: 'Detroit Pistons',
    league: 'NBA',
    venue: 'Little Caesars Arena',
    station: 'Sproat / Adelaide (QLINE) · Grand Circus (DPM)',
    href: 'https://www.nba.com/pistons/schedule',
  },
];

export const activities = [
  {
    name: 'Campus Martius Park events',
    area: 'Downtown',
    note: 'Seasonal public programming, ice rink in winter',
    station: 'Campus Martius (QLINE) / Financial District (DPM)',
    href: 'https://downtowndetroit.org/events/',
    downtown: true,
  },
  {
    name: 'Beacon Park programming',
    area: 'Downtown',
    note: 'Free concerts, night markets and food trucks',
    station: 'Fort / Cass Station',
    href: 'https://downtowndetroit.org/events/',
    downtown: true,
  },
  {
    name: 'Detroit RiverWalk',
    area: 'Downtown riverfront',
    note: 'Public riverfront paths and conservatory',
    station: 'Renaissance Center Station',
    href: 'https://detroitriverfront.org/events',
    downtown: true,
  },
  {
    name: 'Brush Park Historic Walking District',
    area: 'Brush Park',
    note: 'Historic Victorians and boutique café corridor',
    station: 'Sproat / Adelaide (QLINE)',
    href: 'https://downtowndetroit.org/',
    downtown: true,
  },
  {
    name: 'Detroit Institute of Arts (DIA)',
    area: 'Midtown Cultural Center',
    note: 'World-class museum free to MI residents',
    station: 'Warren Avenue (QLINE)',
    href: 'https://dia.org/',
    downtown: true,
  },
  {
    name: 'Capitol Park',
    area: 'Downtown',
    note: 'Public green plaza with pop-up events',
    station: 'Times Square Station',
    href: 'https://downtowndetroit.org/',
    downtown: true,
  },
].filter((a) => a.downtown);

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
    walkingDirections:
      'Exit station north onto Cass Ave, head half a block south to Larned St. Entrance is across from Huntington Place.',
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
    walkingDirections:
      'Exit Michigan Station east towards Washington Blvd. The historic hotel tower entrance is 1 block south on Washington Blvd.',
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
    walkingDirections:
      'Direct indoor climate-controlled skywalk connection from the Millender Center Station platform directly into the hotel lobby.',
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
    walkingDirections:
      'Exit Broadway Station west along John R St toward Woodward Ave. Turn left into Parker’s Alley or Woodward entrance.',
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
    walkingDirections:
      'Exit Financial District onto Jefferson Ave and head 1 block south on Washington Blvd toward the river.',
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
    walkingDirections:
      'Direct 3rd floor enclosed pedestrian skybridge directly connecting the People Mover station to the casino & hotel atrium.',
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
    walkingDirections:
      'The station entrance sits directly on the Park Ave sidewalk next to the iconic neo-renaissance David Whitney building lobby.',
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
  walkingFromStation:
    'Walk 1 block south on Randolph St or Larned St to the Mariners’ Church tunnel plaza boarding platform.',
  fareCAD: '$15.00 – $17.50 CAD one-way',
  fareUSD: 'Credit or debit card accepted on bus (converts automatically)',
  paymentMethod: 'Contactless debit / credit card on bus boarding (no cash needed)',
  documentRequirements: [
    'Valid U.S. or Canadian Passport (or Passport Card)',
    'Enhanced Driver’s License (EDL)',
    'NEXUS / FAST Trusted Traveler Card',
  ],
  scheduleNotes:
    'Runs every 60–120 minutes daily directly under the Detroit River to Windsor Transit Terminal (Downtown Windsor).',
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
    coordinate: [-83.0446, 42.34],
    primaryStationId: 'greektown',
    primaryStationName: 'Greektown Station',
    primaryLine: 'mover',
    secondaryStationId: 'broadway',
    secondaryStationName: 'Broadway Station',
    walkingDistanceMiles: 0.28,
    walkingMinutes: 5,
    walkingDirections:
      'Exit Greektown Station, walk northeast along Beaubien St or St. Antoine St towards E Adams Ave. Gate G entrance is on Adams.',
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
    walkingDirections:
      'The QLINE streetcar stops directly in front of the arena doors along Woodward Ave. Step off directly onto the arena plaza.',
    popularEvents: 'Red Wings NHL, Pistons NBA, arena concerts, UFC',
  },
  {
    id: 'comerica-park',
    name: 'Comerica Park',
    category: 'Sports & Stadium',
    description: 'Home of the Detroit Tigers & open-air downtown ballpark.',
    icon: 'baseball',
    coordinate: [-83.0485, 42.339],
    primaryStationId: 'broadway',
    primaryStationName: 'Broadway Station',
    primaryLine: 'mover',
    secondaryStationId: 'grand-circus',
    secondaryStationName: 'Grand Circus Park Station',
    walkingDistanceMiles: 0.2,
    walkingMinutes: 4,
    walkingDirections:
      'Exit Broadway Station north onto John R St, continue 2 short blocks past Grand Circus Park directly into the Comerica Park outfield gates.',
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
    walkingDirections:
      'Direct dual-transit hub: step off the People Mover elevated platform and transfer directly to the Woodward QLINE streetcar.',
    popularEvents: 'Theater District dining, Detroit Opera House, historic fountain plaza',
  },
  {
    id: 'campus-martius',
    name: 'Campus Martius Park',
    category: 'Public Park & Civic',
    description:
      'Detroit’s official Point of Origin: year-round ice rink, dining, beach & civic concerts.',
    icon: 'sparkles',
    coordinate: [-83.0467, 42.3318],
    primaryStationId: 'cadillac',
    primaryStationName: 'Cadillac Center Station',
    primaryLine: 'mover',
    secondaryStationId: 'ql-campus-martius',
    secondaryStationName: 'Campus Martius (QLINE)',
    walkingDistanceMiles: 0.12,
    walkingMinutes: 2,
    walkingDirections:
      'Exit Cadillac Center west towards Woodward Ave. Campus Martius Park, the ice rink, Parc restaurant and monument are right in front of you.',
    popularEvents: 'Winter ice skating rink, summer beach party, Detroit Tree Lighting, live music',
  },
  {
    id: 'hart-plaza',
    name: 'Hart Plaza',
    category: 'Waterfront',
    description:
      'Waterfront civic plaza on the Detroit River featuring Dodge Fountain & major music festivals.',
    icon: 'waves',
    coordinate: [-83.0441, 42.3274],
    primaryStationId: 'financial',
    primaryStationName: 'Financial District Station',
    primaryLine: 'mover',
    secondaryStationId: 'renaissance',
    secondaryStationName: 'Renaissance Center Station',
    walkingDistanceMiles: 0.15,
    walkingMinutes: 3,
    walkingDirections:
      'Exit Financial District south along Griswold St toward the Detroit River. Hart Plaza amphitheater entrance is on Jefferson Ave.',
    popularEvents:
      'Movement Electronic Music Festival, Detroit Jazz Festival, ethnic river festivals',
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
    shortDesc:
      'Official Transit Windsor Tunnel Bus guide, nearest station, and border credentials.',
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

export type TransitRouteLeg = {
  line: TransitLine;
  fromStation: Station;
  toStation: Station;
  stopsCount: number;
  estimatedRideMinutes: number;
  intermediateStations: string[];
};

export type TransitRoutePlan = {
  originStation: Station;
  destinationStation: Station;
  destinationHubName: string;
  line: TransitLine;
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
  /** One leg for a same-line trip, two when the rider has to change lines. */
  legs: [TransitRouteLeg, ...TransitRouteLeg[]];
  /** Platform where the rider changes lines, when applicable. */
  transferStation: Station | null;
  /** Minutes spent walking between the two transfer platforms. */
  transferWalkMinutes: number;
};

/** The People Mover and the QLINE only meet at Grand Circus Park. */
export const lineTransfers: {
  id: string;
  label: string;
  lines: TransitLine[];
  stations: Record<TransitLine, string>;
}[] = [
  {
    id: 'grand-circus-park',
    label: 'Grand Circus Park',
    lines: ['mover', 'qline'],
    stations: { mover: 'grand-circus', qline: 'ql-grand-circus' },
  },
];

const MOVER_MINUTES_PER_STOP = 2;
const QLINE_MINUTES_PER_STOP = 2.5;
const WALK_MILES_PER_MINUTE = 1 / 20;

type LegStops = { stopsCount: number; intermediateStations: string[] };

/**
 * People Mover loop leg. The loop is a single counter-clockwise circuit that
 * runs in one direction only, so the ride always follows the station order
 * starting at Times Square.
 */
function moverLegStops(from: Station, to: Station): LegStops {
  const fromIdx = peopleMoverStations.findIndex((s) => s.id === from.id);
  const toIdx = peopleMoverStations.findIndex((s) => s.id === to.id);
  if (fromIdx === -1 || toIdx === -1) return { stopsCount: 0, intermediateStations: [] };

  const total = peopleMoverStations.length;
  const stopsCount = (toIdx - fromIdx + total) % total;
  const intermediateStations: string[] = [];
  for (let hop = 1; hop < stopsCount; hop += 1) {
    const station = peopleMoverStations[(fromIdx + hop) % total];
    if (station) intermediateStations.push(station.name);
  }
  return { stopsCount, intermediateStations };
}

/** QLINE corridor leg. The streetcar runs in both directions along Woodward. */
function qlineLegStops(from: Station, to: Station): LegStops {
  const fromIdx = qlineStations.findIndex((s) => s.id === from.id);
  const toIdx = qlineStations.findIndex((s) => s.id === to.id);
  if (fromIdx === -1 || toIdx === -1) return { stopsCount: 0, intermediateStations: [] };

  const step = toIdx > fromIdx ? 1 : -1;
  const intermediateStations: string[] = [];
  for (let index = fromIdx + step; index !== toIdx; index += step) {
    const station = qlineStations[index];
    if (station) intermediateStations.push(station.name);
  }
  return { stopsCount: Math.abs(toIdx - fromIdx), intermediateStations };
}

function buildLeg(line: TransitLine, from: Station, to: Station): TransitRouteLeg {
  const { stopsCount, intermediateStations } =
    line === 'qline' ? qlineLegStops(from, to) : moverLegStops(from, to);
  const minutesPerStop = line === 'qline' ? QLINE_MINUTES_PER_STOP : MOVER_MINUTES_PER_STOP;
  return {
    line,
    fromStation: from,
    toStation: to,
    stopsCount,
    estimatedRideMinutes:
      stopsCount === 0 ? 0 : Math.max(1, Math.round(stopsCount * minutesPerStop)),
    intermediateStations,
  };
}

/**
 * Builds the ride legs for a trip. Same-line trips ride directly; trips that
 * cross between the People Mover and the QLINE transfer at Grand Circus Park
 * instead of reporting an impossible single-line ride.
 */
function buildLegs(origin: Station, destination: Station): [TransitRouteLeg, ...TransitRouteLeg[]] {
  if (origin.line === destination.line) {
    return [buildLeg(origin.line, origin, destination)];
  }

  const transfer = lineTransfers.find(
    (t) => t.lines.includes(origin.line) && t.lines.includes(destination.line),
  );
  const originTransfer = transfer ? findStation(transfer.stations[origin.line]) : undefined;
  const destinationTransfer = transfer
    ? findStation(transfer.stations[destination.line])
    : undefined;
  if (!originTransfer || !destinationTransfer) {
    return [buildLeg(origin.line, origin, destination)];
  }

  return [
    buildLeg(origin.line, origin, originTransfer),
    buildLeg(destination.line, destinationTransfer, destination),
  ];
}

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
    // HotelGuide | CanadaGuide
    destinationStationId = targetDestination.nearestStationId;
    if ('title' in targetDestination) {
      // CanadaGuide: the border terminal is walked from the station, not a hotel.
      targetHubName = targetDestination.title;
      walkDirections = targetDestination.walkingFromStation;
      targetCoord = targetDestination.terminalCoordinate;
    } else {
      // HotelGuide
      targetHubName = targetDestination.name;
      walkMiles = targetDestination.walkingDistanceMiles;
      walkMin = targetDestination.walkingMinutes;
      walkDirections = targetDestination.walkingDirections;
      targetCoord = targetDestination.coordinate;
    }
  } else if ('primaryStationId' in targetDestination) {
    // DestinationShortcut
    destinationStationId = targetDestination.primaryStationId;
    targetHubName = targetDestination.name;
    walkMiles = targetDestination.walkingDistanceMiles;
    walkMin = targetDestination.walkingMinutes;
    walkDirections = targetDestination.walkingDirections;
    targetCoord = targetDestination.coordinate;
  } else {
    // Station
    destinationStationId = targetDestination.id;
    targetHubName = targetDestination.name;
    targetCoord = targetDestination.coordinate;
    walkMiles = 0.05;
    walkMin = 1;
    walkDirections =
      targetDestination.entranceNotes ||
      'Platform elevator and stairs connect directly to street level.';
  }

  const destinationStation = findStation(destinationStationId) ?? peopleMoverStations[0];

  // Determine Origin Station: Manual override > User GPS nearest > Loop start
  let originStation: Station;
  if (manualOriginStationId) {
    originStation = findStation(manualOriginStationId) ?? peopleMoverStations[0];
  } else if (userCoordinate) {
    // Board the closest station that serves the destination's line.
    const sameLinePool = destinationStation.line === 'qline' ? qlineStations : peopleMoverStations;
    let nearest: Station | undefined;
    let nearestDistance = Infinity;
    for (const station of sameLinePool) {
      const distance = milesBetween(userCoordinate, station.coordinate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = station;
      }
    }
    originStation = nearest ?? peopleMoverStations[0];
  } else {
    originStation = destinationStation.line === 'qline' ? qlineStations[0] : peopleMoverStations[0];
  }

  const legs = buildLegs(originStation, destinationStation);
  const [primaryLeg, secondLeg] = legs;
  const stopsCount = legs.reduce((sum, leg) => sum + leg.stopsCount, 0);
  const estimatedRideMinutes = legs.reduce((sum, leg) => sum + leg.estimatedRideMinutes, 0);
  const intermediateStations = legs.flatMap((leg) => leg.intermediateStations);
  const transferStation = secondLeg ? primaryLeg.toStation : null;
  const transferWalkMinutes = secondLeg
    ? Math.max(
        1,
        Math.round(
          (milesBetween(primaryLeg.toStation.entrance, secondLeg.fromStation.entrance) * 1.3) /
            WALK_MILES_PER_MINUTE,
        ),
      )
    : 0;

  return {
    originStation,
    destinationStation,
    destinationHubName: targetHubName,
    line: primaryLeg.line,
    stopsCount,
    estimatedRideMinutes,
    intermediateStations,
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
    legs,
    transferStation,
    transferWalkMinutes,
  };
}
