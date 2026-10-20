import { createFileRoute } from '@tanstack/react-router';
import {
  PRICING_TABLE_ID,
  createCheckoutSession,
  parseCheckoutRequest,
  plansAllowedForSlot,
  resolvePlanPriceIds,
  retrieveCheckoutSession,
  slotAcceptsPlan,
  verifyCheckoutSession,
  type AnchorPlan,
} from '@/lib/stripe';
import { readServerSecret } from '@/lib/serverEnv';

/** Rejects cross-site calls to the checkout endpoint. */
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin navigations and server-to-server calls
  const host = request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      // Create a Checkout Session for a station anchor slot.
      POST: async ({ request, context }) => {
        if (!isAllowedOrigin(request)) {
          return Response.json({ error: 'Cross-origin checkout requests are not allowed.' }, { status: 403 });
        }
        const secretKey = await readServerSecret('STRIPE_SECRET_KEY', context);
        if (!secretKey) {
          return Response.json(
            { error: 'Checkout is not configured on this deployment.' },
            { status: 503 }
          );
        }
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: 'Invalid checkout request.' }, { status: 400 });
        }
        const parsed = parseCheckoutRequest(payload);
        if (!parsed.ok) {
          return Response.json({ error: parsed.error }, { status: 400 });
        }

        // The slot decides which published plans may be bought.
        const allowed = plansAllowedForSlot(parsed.value.slot);
        const plan: AnchorPlan = parsed.value.plan ?? allowed[0] ?? 'annual';
        if (!slotAcceptsPlan(parsed.value.slot, plan)) {
          return Response.json(
            { error: `Slot ${parsed.value.slot} can only be purchased on the ${allowed.join(' or ')} plan.` },
            { status: 400 }
          );
        }

        const origin = (await readServerSecret('PUBLIC_APP_URL', context)) ?? new URL(request.url).origin;
        const pricingTableId =
          (await readServerSecret('STRIPE_PRICING_TABLE_ID', context)) ?? PRICING_TABLE_ID;
        const configured = {
          ...((await readServerSecret('STRIPE_PRICE_MONTHLY', context))
            ? { monthly: (await readServerSecret('STRIPE_PRICE_MONTHLY', context)) as string }
            : {}),
          ...((await readServerSecret('STRIPE_PRICE_ANNUAL', context))
            ? { annual: (await readServerSecret('STRIPE_PRICE_ANNUAL', context)) as string }
            : {}),
        };
        const priceIds = await resolvePlanPriceIds(fetch, { secretKey, pricingTableId, configured });
        const priceId = priceIds[plan];

        try {
          const session = await createCheckoutSession(fetch, {
            secretKey,
            origin,
            body: { ...parsed.value, plan },
            ...(priceId ? { priceId } : {}),
            pricingTableId,
          });
          return Response.json({ url: session.url, sessionId: session.id, plan, slot: parsed.value.slot });
        } catch (error) {
          console.error('Stripe session creation failed', error);
          return Response.json({ error: 'Unable to start checkout.' }, { status: 502 });
        }
      },

      // Verify a Checkout Session after the redirect back to the site.
      GET: async ({ request, context }) => {
        const secretKey = await readServerSecret('STRIPE_SECRET_KEY', context);
        if (!secretKey) {
          return Response.json({ error: 'Checkout is not configured on this deployment.' }, { status: 503 });
        }
        const sessionId = new URL(request.url).searchParams.get('session_id');
        if (!sessionId) {
          return Response.json({ error: 'A session id is required.' }, { status: 400 });
        }
        const pricingTableId =
          (await readServerSecret('STRIPE_PRICING_TABLE_ID', context)) ?? PRICING_TABLE_ID;
        const configured = {
          ...((await readServerSecret('STRIPE_PRICE_MONTHLY', context))
            ? { monthly: (await readServerSecret('STRIPE_PRICE_MONTHLY', context)) as string }
            : {}),
          ...((await readServerSecret('STRIPE_PRICE_ANNUAL', context))
            ? { annual: (await readServerSecret('STRIPE_PRICE_ANNUAL', context)) as string }
            : {}),
        };
        const priceIds = await resolvePlanPriceIds(fetch, { secretKey, pricingTableId, configured });
        try {
          const session = await retrieveCheckoutSession(fetch, { secretKey, sessionId });
          return Response.json(verifyCheckoutSession(session, { priceIds }));
        } catch (error) {
          console.error('Stripe session lookup failed', error);
          return Response.json({ error: 'Unable to verify checkout.' }, { status: 502 });
        }
      },
    },
  },
});
