import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { findStation } from '@/data/transit';
import { recordSlotEvent } from '@/lib/slotStats';

const schema = z.object({
  stationId: z.string().regex(/^[a-z0-9-]{2,64}$/),
  slot: z.union([z.literal(1), z.literal(2)]),
  event: z.enum(['view', 'map', 'visit']),
});

export const Route = createFileRoute('/api/slot-event')({
  server: {
    handlers: {
      // Public, write-only counter for sponsor slot reach. It accepts only a
      // known station and slot, stores no personal data and returns nothing.
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
          await recordSlotEvent(
            parsed.data.stationId,
            parsed.data.slot,
            parsed.data.event,
            context,
          );
        } catch (error) {
          console.error('slot event failed', error);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
