import { createFileRoute } from '@tanstack/react-router';
import { listAssignments } from '@/lib/anchorStore';

export const Route = createFileRoute('/api/anchor-slots')({
  server: {
    handlers: {
      // Public read of the anchor slots that an admin has assigned.
      GET: async ({ context }) => {
        const assignments = await listAssignments(context);
        return Response.json({ assignments });
      },
    },
  },
});
