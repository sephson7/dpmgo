import type * as GeoJSON from 'geojson';
import type { Coordinate } from './transit';

/**
 * Prototype landmark models, built from plain geometry so the map downloads
 * nothing extra. Heights are in metres; footprints are approximate and meant
 * to read as the real silhouette, not as surveyed outlines.
 */
export type LandmarkPart = 'body' | 'glass' | 'glow';

type PartProps = { landmark: string; part: LandmarkPart; height: number; base: number; color: string };

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
  ring.push(ring[0] as Coordinate);
  return ring;
}

function rect(center: Coordinate, width: number, depth: number, angleDeg = 0): Coordinate[] {
  const a = (angleDeg * Math.PI) / 180;
  const corners = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2],
    [-width / 2, depth / 2],
  ].map(([x, y]) =>
    offset(center, x! * Math.cos(a) - y! * Math.sin(a), x! * Math.sin(a) + y! * Math.cos(a)),
  );
  return [...corners, corners[0] as Coordinate];
}

function part(ring: Coordinate[], props: PartProps, hole?: Coordinate[]): GeoJSON.Feature<GeoJSON.Polygon, PartProps> {
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: hole ? [ring, [...hole].reverse()] : [ring] }, properties: props };
}

const BODY = '#1b2733';
const GLASS = '#2f4a5c';
const CYAN = '#00f0ff';
const GOLD = '#ffbb70';

/** GM Renaissance Center: 222 m central cylinder ringed by four 158 m towers on a podium. */
function renaissanceCenter(): GeoJSON.Feature<GeoJSON.Polygon, PartProps>[] {
  const c: Coordinate = [-83.03974, 42.32903];
  const id = 'renaissance-center';
  const parts = [
    part(circle(c, 92, 36), { landmark: id, part: 'body', height: 24, base: 0, color: BODY }),
    part(circle(c, 31), { landmark: id, part: 'glass', height: 218, base: 0, color: GLASS }),
    part(circle(c, 33), { landmark: id, part: 'glow', height: 222, base: 214, color: CYAN }),
    part(circle(c, 22), { landmark: id, part: 'body', height: 232, base: 222, color: BODY }),
  ];
  for (const [e, n] of [
    [-58, 52],
    [58, 52],
    [-58, -52],
    [58, -52],
  ] as const) {
    const t = offset(c, e, n);
    parts.push(
      part(circle(t, 21), { landmark: id, part: 'glass', height: 155, base: 0, color: GLASS }),
      part(circle(t, 22.5), { landmark: id, part: 'glow', height: 158, base: 152, color: CYAN }),
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
    part(rect(c, 230, 330, angle), { landmark: id, part: 'body', height: 26, base: 0, color: BODY }),
    part(rect(offset(c, 0, 10), 150, 240, angle), {
      landmark: id,
      part: 'body',
      height: 34,
      base: 26,
      color: '#223241',
    }),
    part(rect(offset(c, 55, -160), 110, 40, angle), {
      landmark: id,
      part: 'glass',
      height: 30,
      base: 0,
      color: GLASS,
    }),
    part(
      rect(c, 234, 334, angle),
      { landmark: id, part: 'glow', height: 27, base: 25, color: GOLD },
      rect(c, 222, 322, angle),
    ),
  ];
}

export const landmarkModels: GeoJSON.FeatureCollection<GeoJSON.Polygon, PartProps> = {
  type: 'FeatureCollection',
  features: [...renaissanceCenter(), ...huntingtonPlace()],
};
