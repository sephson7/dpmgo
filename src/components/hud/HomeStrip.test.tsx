import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import HomeStrip from './HomeStrip';
import { findStation, type Station } from '@/data/transit';
import type { StationSchedule } from '@/data/schedule';

const station = (id: string): Station => findStation(id)!;

const running: StationSchedule = {
  running: true,
  trains: [{ time: '5:42 PM', minutes: 3, day: null }],
  specialToday: false,
  specialDays: [],
};

const closed: StationSchedule = {
  running: false,
  trains: [{ time: '6:00 AM', minutes: 420, day: 'Thu, Oct 22' }],
  specialToday: false,
  specialDays: [],
};

/** Renders the strip and lets the partner request settle. */
async function renderStrip(node: React.ReactElement) {
  const result = render(node);
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

/** Advances the rotation by one step. */
async function rotate() {
  await act(async () => {
    vi.advanceTimersByTime(4600);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ assignments: [] }) })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('home strip', () => {
  it('leads with the next published departure', async () => {
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('times-square')}
        schedule={running}
        onOpenStation={() => undefined}
      />,
    );
    expect(screen.getByText(/TIMES SQUARE STATION · DEPARTS 5:42 PM/)).toBeInTheDocument();
  });

  it('reports the suspended service and the next run', async () => {
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('times-square')}
        schedule={closed}
        onOpenStation={() => undefined}
      />,
    );
    expect(screen.getByText(/SERVICE SUSPENDED · NEXT RUN 6:00 AM/)).toBeInTheDocument();
  });

  it('offers the partner of a station whose slot is filled', async () => {
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('fort-cass')}
        schedule={running}
        onOpenStation={() => undefined}
      />,
    );
    await rotate();
    expect(
      screen.getByText(/FEATURED AT FORT \/ CASS STATION · Lafayette Coney Island/),
    ).toBeInTheDocument();
  });

  it('never offers a partner when the slot is empty', async () => {
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('times-square')}
        schedule={running}
        onOpenStation={() => undefined}
      />,
    );
    for (let step = 0; step < 3; step += 1) {
      await rotate();
      expect(screen.queryByText(/FEATURED AT/)).toBeNull();
      expect(screen.queryByText(/ROTATING PARTNER AT/)).toBeNull();
    }
  });

  it('opens the station, and the sponsor card for a partner item', async () => {
    const opened: [string, boolean][] = [];
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('fort-cass')}
        schedule={running}
        onOpenStation={(id, partner) => opened.push([id, partner])}
      />,
    );
    const strip = screen.getByRole('button');
    act(() => {
      strip.click();
    });
    // The rider's item is showing first, so it opens the station, not the card.
    expect(opened[0]).toEqual(['fort-cass', false]);

    await rotate();
    act(() => {
      screen.getByRole('button').click();
    });
    // A partner item lands on the sponsor card.
    expect(opened[1]).toEqual(['fort-cass', true]);
  });

  it('rotates through the items', async () => {
    await renderStrip(
      <HomeStrip
        variant="pill"
        station={station('fort-cass')}
        schedule={running}
        onOpenStation={() => undefined}
      />,
    );
    expect(screen.getByText(/DEPARTS 5:42 PM/)).toBeInTheDocument();
    await rotate();
    expect(screen.getByText(/FEATURED AT FORT \/ CASS STATION/)).toBeInTheDocument();
    await rotate();
    expect(screen.getByText(/DEPARTS 5:42 PM/)).toBeInTheDocument();
  });
});
