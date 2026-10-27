import type * as GeoJSON from 'geojson';
import { popularHotels, destinationShortcuts, type Coordinate } from './transit';

/**
 * Prototype landmark models, built from plain geometry so the map downloads
 * nothing extra. Heights are in metres; footprints are approximate and meant
 * to read as the real silhouette, not as surveyed outlines.
 */
export type LandmarkPart = 'body' | 'glass' | 'glow' | 'stone' | 'roof' | 'warm';

type PartProps = {
  landmark: string;
  part: LandmarkPart;
  height: number;
  base: number;
};

const M_PER_DEG_LAT = 111_320;
const mPerDegLng = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/** Offset a coordinate by metres east / north. */
export function offset([lng, lat]: Coordinate, east: number, north: number): Coordinate {
  return [lng + east / mPerDegLng(lat), lat + north / M_PER_DEG_LAT];
}

export function circle(center: Coordinate, radius: number, sides = 28): Coordinate[] {
  const ring: Coordinate[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    ring.push(offset(center, Math.cos(a) * radius, Math.sin(a) * radius));
  }
  const first = ring[0];
  if (first) ring.push(first);
  return ring;
}

function rect(center: Coordinate, width: number, depth: number, angleDeg = 0): Coordinate[] {
  const a = (angleDeg * Math.PI) / 180;
  const vertices: Coordinate[] = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2],
    [-width / 2, depth / 2],
  ];
  const corners = vertices.map(([x, y]) =>
    offset(center, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)),
  );
  const first = corners[0];
  return first ? [...corners, first] : corners;
}

function part(
  ring: Coordinate[],
  props: PartProps,
  hole?: Coordinate[],
): GeoJSON.Feature<GeoJSON.Polygon, PartProps> {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: hole ? [ring, [...hole].reverse()] : [ring] },
    properties: props,
  };
}

/** GM Renaissance Center: 222 m central cylinder ringed by four 158 m towers on a podium. */
function renaissanceCenter(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c: Coordinate = [-83.03974, 42.32903];
  const id = 'renaissance-center';
  const parts = [
    part(circle(c, 92, 36), { landmark: id, part: 'body', height: 24, base: 0 }),
    part(circle(c, 31), { landmark: id, part: 'glass', height: 218, base: 24 }),
    part(circle(c, 33), { landmark: id, part: 'glow', height: 222, base: 218 }),
    part(circle(c, 22), { landmark: id, part: 'body', height: 232, base: 222 }),
  ];
  for (const [e, n] of [
    [-58, 52],
    [58, 52],
    [-58, -52],
    [58, -52],
  ] as const) {
    const t = offset(c, e, n);
    parts.push(
      part(circle(t, 21), { landmark: id, part: 'glass', height: 155, base: 24 }),
      part(circle(t, 22.5), { landmark: id, part: 'glow', height: 158, base: 155 }),
    );
  }
  return parts;
}

/** Huntington Place: long riverfront convention hall with a raised roof deck and glass atrium. */
function huntingtonPlace(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c: Coordinate = [-83.0501, 42.3265];
  const id = 'huntington-place';
  const angle = 21; // aligned with the downtown street grid
  return [
    part(rect(c, 230, 330, angle), {
      landmark: id,
      part: 'body',
      height: 26,
      base: 0,
    }),
    part(rect(offset(c, 0, 10), 150, 240, angle), {
      landmark: id,
      part: 'body',
      height: 34,
      base: 26,
    }),
    part(rect(offset(c, 55, -160), 110, 40, angle), {
      landmark: id,
      part: 'glass',
      height: 30,
      base: 0,
    }),
    part(
      rect(c, 234, 334, angle),
      { landmark: id, part: 'warm', height: 27, base: 26 },
      rect(c, 222, 322, angle),
    ),
  ];
}

/** Shared venue coordinates keep the architectural model and navigation pin together. */
function venueCenter(id: string): Coordinate {
  const venue = [...popularHotels, ...destinationShortcuts].find(
    (candidate) => candidate.id === id,
  );
  if (!venue) throw new Error(`Missing landmark venue: ${id}`);
  return venue.coordinate;
}

/** Low arena bowl, stepped metal roof, and Woodward-facing glass frontage. */
function littleCaesarsArena(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c = venueCenter('little-caesars-arena');
  const landmark = 'little-caesars-arena';
  return [
    part(rect(c, 185, 205, 21), { landmark, part: 'stone', height: 19, base: 0 }),
    part(rect(c, 151, 173, 21), { landmark, part: 'roof', height: 32, base: 19 }),
    part(rect(c, 125, 147, 21), { landmark, part: 'roof', height: 39, base: 32 }),
    part(rect(offset(c, 76, 12), 18, 147, 21), {
      landmark,
      part: 'glass',
      height: 18,
      base: 0,
    }),
    part(
      rect(c, 189, 209, 21),
      { landmark, part: 'warm', height: 20, base: 19 },
      rect(c, 177, 197, 21),
    ),
  ];
}

/** Enclosed stadium volume with a shallow stepped roof and lower entrance wings. */
function fordField(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c = venueCenter('ford-field');
  const landmark = 'ford-field';
  return [
    part(rect(c, 215, 185, 21), { landmark, part: 'stone', height: 23, base: 0 }),
    part(rect(c, 192, 163, 21), { landmark, part: 'roof', height: 35, base: 23 }),
    part(rect(c, 161, 128, 21), { landmark, part: 'roof', height: 43, base: 35 }),
    part(rect(offset(c, 0, -83), 166, 20, 21), {
      landmark,
      part: 'glass',
      height: 22,
      base: 0,
    }),
  ];
}

/** Book Cadillac's masonry shaft, setbacks, and paired rooftop pavilions. */
function bookCadillac(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c = venueCenter('westin-book-cadillac');
  const landmark = 'book-cadillac';
  const parts = [
    part(rect(c, 66, 57, 21), { landmark, part: 'stone', height: 24, base: 0 }),
    part(rect(c, 58, 47, 21), { landmark, part: 'stone', height: 92, base: 24 }),
    part(rect(c, 50, 40, 21), { landmark, part: 'stone', height: 106, base: 92 }),
    part(rect(c, 52, 42, 21), { landmark, part: 'warm', height: 108, base: 106 }),
  ];
  for (const east of [-18, 18]) {
    const crown = offset(c, east, 0);
    parts.push(
      part(rect(crown, 13, 17, 21), { landmark, part: 'stone', height: 118, base: 108 }),
      part(rect(crown, 9, 13, 21), { landmark, part: 'roof', height: 123, base: 118 }),
    );
  }
  return parts;
}

/** David Whitney's compact, courtyard-pierced masonry tower beside Grand Circus. */
function davidWhitney(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c = venueCenter('david-whitney');
  const landmark = 'david-whitney';
  return [
    part(rect(c, 43, 37, 21), { landmark, part: 'stone', height: 15, base: 0 }),
    part(
      rect(c, 41, 35, 21),
      { landmark, part: 'stone', height: 75, base: 15 },
      rect(c, 16, 14, 21),
    ),
    part(
      rect(c, 43, 37, 21),
      { landmark, part: 'warm', height: 77, base: 75 },
      rect(c, 16, 14, 21),
    ),
    part(
      rect(c, 39, 33, 21),
      { landmark, part: 'roof', height: 83, base: 77 },
      rect(c, 16, 14, 21),
    ),
  ];
}

export const landmarkModels: GeoJSON.FeatureCollection<GeoJSON.Polygon, PartProps> = {
  type: 'FeatureCollection',
  features: [
    ...renaissanceCenter(),
    ...huntingtonPlace(),
    ...littleCaesarsArena(),
    ...fordField(),
    ...bookCadillac(),
    ...davidWhitney(),
  ],
};

// Only suppress fully contained stock buildings; neighboring venue footprints stay intact.
export const landmarkFootprints: GeoJSON.MultiPolygon = {
  type: 'MultiPolygon',
  coordinates: landmarkModels.features
    .filter(
      (feature, index, features) =>
        features.findIndex((other) => other.properties.landmark === feature.properties.landmark) ===
        index,
    )
    .map((feature) => feature.geometry.coordinates),
};
