import { describe, expect, it } from 'vitest';
import { usesAppleMaps, walkingDirectionsUrl } from './walkingDirections';

describe('one-tap restaurant walking directions', () => {
  it('sends the exact restaurant coordinate to Google in walking mode', () => {
    expect(walkingDirectionsUrl([-83.0466, 42.3316])).toBe('https://www.google.com/maps/dir/?api=1&destination=42.3316,-83.0466&travelmode=walking');
  });
  it('uses walking mode on Apple Maps for iOS including desktop-mode iPads', () => {
    expect(usesAppleMaps('iPhone')).toBe(true);
    expect(usesAppleMaps('Macintosh', 5)).toBe(true);
    expect(usesAppleMaps('Macintosh', 0)).toBe(false);
    expect(usesAppleMaps('Android')).toBe(false);
    expect(walkingDirectionsUrl([-83.0466, 42.3316], true)).toBe('https://maps.apple.com/?daddr=42.3316,-83.0466&dirflg=w');
  });
});