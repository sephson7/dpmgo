import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

async function loadAt(path: string) {
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return router.state.matches;
}

function failedMatches(matches: Awaited<ReturnType<typeof loadAt>>) {
  return matches.filter((m) => m.status !== 'success').map((m) => [m.routeId, String(m.error)]);
}

// Resolve routes without rendering: jsdom never loads stylesheets, and React
// holds the whole render until any stylesheet link in the root head loads.
describe('App routing', () => {
  it('loads the index route without a loader error', async () => {
    const matches = await loadAt('/');

    expect(failedMatches(matches)).toEqual([]);
  });

  it('loads an unknown path without a loader error', async () => {
    const matches = await loadAt('/this-route-does-not-exist');

    expect(failedMatches(matches)).toEqual([]);
  });

  it('loads the partner checkout without a loader error', async () => {
    const matches = await loadAt('/partner');

    expect(failedMatches(matches)).toEqual([]);
  });

  it('sends the old partner address to the partner checkout', async () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
      history: createMemoryHistory({ initialEntries: ['/pricing?station=fort-cass&slot=1'] }),
    });
    await router.load();

    // Flyers printed before the partner page existed still land on it.
    expect(router.state.location.pathname).toBe('/partner');
    expect(router.state.location.search).toMatchObject({ station: 'fort-cass' });
  });
});
