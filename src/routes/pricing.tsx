import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * The old address of the partner checkout.
 *
 * Flyers, QR codes and links that were printed before the partner page
 * existed still point here, so they are sent to /partner, which is the
 * canonical address for the whole flow. The query string is carried over, so
 * a flyer that names a station still arrives with that station selected.
 */
export const Route = createFileRoute('/pricing')({
  beforeLoad: ({ location }) => {
    // The raw search string is carried over, so a flyer that names a station
    // still arrives with that station selected.
    throw redirect({ href: `/partner${location.searchStr}` });
  },
});
