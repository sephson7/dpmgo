import { createFileRoute } from '@tanstack/react-router';
import {
  adminCookie,
  adminPortalConfigured,
  createAdminToken,
  verifyAdminCredentials,
} from '@/lib/adminAuth';
import { readServerSecret } from '@/lib/serverEnv';

export const Route = createFileRoute('/api/admin/login')({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        // The portal has no default credentials, so an unconfigured
        // deployment answers with "not configured" rather than a sign in.
        if (!(await adminPortalConfigured(context))) {
          return Response.json(
            { error: 'The partner portal is not configured on this deployment.' },
            { status: 503 },
          );
        }
        let payload: { username?: string; password?: string } = {};
        try {
          payload = (await request.json()) as { username?: string; password?: string };
        } catch {
          return Response.json({ error: 'Invalid sign in request.' }, { status: 400 });
        }
        const username = typeof payload.username === 'string' ? payload.username : '';
        const password = typeof payload.password === 'string' ? payload.password : '';
        const ok = await verifyAdminCredentials(username, password, context);
        if (!ok) {
          return Response.json({ error: 'Invalid username or password.' }, { status: 401 });
        }
        const token = await createAdminToken(context);
        if (!token) {
          return Response.json(
            { error: 'The partner portal is not configured on this deployment.' },
            { status: 503 },
          );
        }
        const origin =
          (await readServerSecret('PUBLIC_APP_URL', context)) ?? new URL(request.url).origin;
        return Response.json(
          { ok: true },
          { headers: { 'Set-Cookie': adminCookie(token, origin.startsWith('https://')) } },
        );
      },
    },
  },
});
