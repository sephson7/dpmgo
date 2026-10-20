import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HomeHud from '@/components/HomeHud';

/**
 * The phone and the desktop render different layouts. The phone must never
 * pay for the desktop directory behind the map.
 */
const setViewport = (width: number) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width: 768px') ? width <= 768 : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  })) as unknown as typeof window.matchMedia;
};

describe('homepage layout', () => {
  beforeEach(() => {
    localStorage.setItem('dpmgo_walkthrough_seen', 'true');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the desktop layout on a wide viewport', async () => {
    setViewport(1440);
    const { container } = render(<HomeHud />);

    await waitFor(() => expect(container.querySelector('.network-panel')).not.toBeNull());
    expect(container.querySelector('.dpm-quick-nav-bar')).not.toBeNull();
    expect(container.querySelector('.quick-routes-trigger')).toBeNull();
    expect(container.querySelector('.mobile-station-trigger')).toBeNull();
    // The desktop directory is the accessible route to the map pins.
    expect(container.querySelector('#station-directory')).not.toBeNull();
  });

  it('renders the phone layout without the desktop directory', async () => {
    setViewport(375);
    const { container } = render(<HomeHud />);

    await waitFor(() => expect(container.querySelector('.quick-routes-trigger')).not.toBeNull());
    // The 25 station buttons of the desktop panel are never in the phone DOM.
    expect(container.querySelector('.network-panel')).toBeNull();
    expect(container.querySelector('.dpm-quick-nav-bar')).toBeNull();
    expect(container.querySelector('.station-scroll')).toBeNull();
    expect(container.querySelector('.mobile-station-trigger')).not.toBeNull();
    expect(screen.getByRole('button', { name: /quick routes/i })).toBeInTheDocument();
  });
});
