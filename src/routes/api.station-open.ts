import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { findStation } from '@/data/transit';
import { recordDrawerOpen } from '@/lib/stationStats';

const schema = z.object({ stationId: z.string().regex(/^[a-z0-9-]{2,64}$/) });

export const Route = createFileRoute('/api/station-open')({
  server: {
    handlers: {
      // Public, write-only counter for station drawer opens. Accepts only a
      // known station, stores no personal data and returns nothing.
      POST: async ({ request, context }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(null, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success || !findStation(parsed.data.stationId)) {
          return new Response(null, { status: 400 });
        }
        try {
          await recordDrawerOpen(parsed.data.stationId, context);
        } catch (error) {
          console.error('station open failed', error);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
