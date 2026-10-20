import { createFileRoute } from '@tanstack/react-router';
import { clearAdminCookie } from '@/lib/adminAuth';

export const Route = createFileRoute('/api/admin/logout')({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearAdminCookie() } });
      },
    },
  },
});
