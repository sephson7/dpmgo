import type { Coordinate } from './transit';

/** Maps chooses the rider's current origin; walking mode is explicit. */
export function walkingDirectionsUrl(coordinate: Coordinate, apple = false): string {
  const destination = `${coordinate[1]},${coordinate[0]}`;
  return apple
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
}

export function usesAppleMaps(userAgent: string, touchPoints = 0): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}