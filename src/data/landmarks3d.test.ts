import { describe, expect, it } from 'vitest';
import { gzipSync } from 'fflate';
import { landmarkModels, landmarkFootprints } from './landmarks3d';

describe('lightweight landmark geometry', () => {
  it('includes the original prototypes and four additional venue silhouettes', () => {
    expect([...new Set(landmarkModels.features.map((f) => f.properties.landmark))]).toEqual([
      'renaissance-center',
      'huntington-place',
      'little-caesars-arena',
      'ford-field',
      'book-cadillac',
      'david-whitney',
    ]);
    expect(landmarkFootprints.coordinates).toHaveLength(6);
  });

  it('uses closed, finite rings and valid metre-based extrusion ranges', () => {
    for (const feature of landmarkModels.features) {
      expect(feature.properties.base).toBeGreaterThanOrEqual(0);
      expect(feature.properties.height).toBeGreaterThan(feature.properties.base);
      for (const ring of feature.geometry.coordinates) {
        expect(ring.length).toBeGreaterThanOrEqual(5);
        expect(ring[0]).toEqual(ring.at(-1));
        for (const [lng, lat] of ring) {
          expect(Number.isFinite(lng) && Number.isFinite(lat)).toBe(true);
          expect(lng).toBeGreaterThan(-83.075);
          expect(lng).toBeLessThan(-83.038);
          expect(lat).toBeGreaterThan(42.324);
          expect(lat).toBeLessThan(42.373);
        }
      }
    }
  });

  it('keeps this batch well below the 2.5 MB compressed asset target', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ landmarkModels, landmarkFootprints }));
    expect(gzipSync(bytes).byteLength).toBeLessThan(2_500_000);
    expect(landmarkModels.features.length).toBeLessThanOrEqual(40);
  });
});
