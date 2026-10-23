import { useEffect } from 'react';
import { act, fireEvent, render, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeHud from './HomeHud';
import { peopleMoverStations } from '@/data/transit';

vi.mock('@/components/hud/MapStage', () => ({
  default: function MockMapStage({ onReady }: { onReady: (ready: boolean) => void }) {
    useEffect(() => onReady(true), [onReady]);
    return null;
  },
}));

describe('initial GPS framing does not interrupt navigation', () => {
  let locate: PositionCallback | undefined;
  beforeEach(() => {
    localStorage.setItem('dpmgo_walkthrough_seen', 'true');
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: vi.fn((callback: PositionCallback) => {
          locate = callback;
          return 1;
        }),
        clearWatch: vi.fn(),
      },
    });
  });
  afterEach(() => {
    cleanup();
    locate = undefined;
    vi.unstubAllGlobals();
  });
  const fix = (index: number) => {
    const station = peopleMoverStations[index];
    if (!station || !locate) throw new Error('Missing GPS test setup');
    act(() =>
      locate?.({
        coords: { longitude: station.coordinate[0], latitude: station.coordinate[1] },
      } as GeolocationPosition),
    );
  };
  it('frames only once and never opens a station drawer', async () => {
    const events: Event[] = [];
    const listener = (event: Event) => events.push(event);
    window.addEventListener('dpm-map-flyto', listener);
    try {
      const { container } = render(<HomeHud />);
      fix(0);
      await waitFor(() => expect(events).toHaveLength(1));
      fix(4);
      expect(events).toHaveLength(1);
      expect(container.querySelector('.detail-drawer')).toBeNull();
    } finally {
      window.removeEventListener('dpm-map-flyto', listener);
    }
  });
  it('does not reframe after the rider touches the interface', async () => {
    const listener = vi.fn();
    window.addEventListener('dpm-map-flyto', listener);
    try {
      render(<HomeHud />);
      fireEvent.pointerDown(document.body);
      fix(0);
      await act(async () => {});
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('dpm-map-flyto', listener);
    }
  });
});
