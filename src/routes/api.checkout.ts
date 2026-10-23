import { createFileRoute } from '@tanstack/react-router';
import {
  CHECKOUT_HOLD_MINUTES,
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
import { confirmPartnerPayment } from '@/lib/partnerCheckout';
import { readServerSecret } from '@/lib/serverEnv';
import { listAssignments, listCheckoutHolds, listLeads, putCheckoutHold } from '@/lib/anchorStore';
import {
  activeCheckoutHold,
  activeExclusiveHold,
  exclusiveTermEnd,
  formatTermEnd,
  pendingPurchase,
} from '@/lib/slotExclusivity';
import { findStation } from '@/data/transit';

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
          return Response.json(
            { error: 'Cross-origin checkout requests are not allowed.' },
            { status: 403 },
          );
        }
        const secretKey = await readServerSecret('STRIPE_SECRET_KEY', context);
        if (!secretKey) {
          return Response.json(
            { error: 'Checkout is not configured on this deployment.' },
            { status: 503 },
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
            {
              error: `Slot ${parsed.value.slot} can only be purchased on the ${allowed.join(' or ')} plan.`,
            },
            { status: 400 },
          );
        }

        // An annual partner's exclusive term protects the slot from resale.
        const hold = activeExclusiveHold(
          await listAssignments(context),
          parsed.value.stationId,
          parsed.value.slot,
        );
        if (hold) {
          const end = exclusiveTermEnd(hold);
          const station = findStation(parsed.value.stationId)?.name ?? 'this station';
          return Response.json(
            {
              error: `Slot ${parsed.value.slot} at ${station} is reserved by an annual partner${
                end ? ` through ${formatTermEnd(end)}` : ''
              }. Please choose another station or slot.`,
            },
            { status: 409 },
          );
        }

        // Concurrency: a paid purchase awaiting review, or another buyer
        // mid-checkout, holds the slot so it can never be sold twice.
        const slotLabel = `Slot ${parsed.value.slot} at ${
          findStation(parsed.value.stationId)?.name ?? 'this station'
        }`;
        if (pendingPurchase(await listLeads(context), parsed.value.stationId, parsed.value.slot)) {
          return Response.json(
            {
              error: `${slotLabel} has a paid purchase awaiting review. Please choose another station or slot.`,
            },
            { status: 409 },
          );
        }
        const liveHold = activeCheckoutHold(
          await listCheckoutHolds(context),
          parsed.value.stationId,
          parsed.value.slot,
        );
        if (liveHold) {
          const minutes = Math.max(
            1,
            Math.ceil((new Date(liveHold.expiresAt).getTime() - Date.now()) / 60_000),
          );
          return Response.json(
            {
              error: `${slotLabel} is being purchased by another business right now. Try again in about ${minutes} minutes or choose another slot.`,
            },
            { status: 409 },
          );
        }

        const origin =
          (await readServerSecret('PUBLIC_APP_URL', context)) ?? new URL(request.url).origin;
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
        const priceIds = await resolvePlanPriceIds(fetch, {
          secretKey,
          pricingTableId,
          configured,
        });
        const priceId = priceIds[plan];

        const purchase = parsed.value;
        try {
          const session = await createCheckoutSession(fetch, {
            secretKey,
            origin,
            body: { ...parsed.value, plan },
            ...(priceId ? { priceId } : {}),
            pricingTableId,
          });
          await putCheckoutHold(
            {
              stationId: purchase.stationId,
              slot: purchase.slot,
              sessionId: session.id,
              expiresAt: new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60_000).toISOString(),
            },
            context,
          );
          return Response.json({
            url: session.url,
            sessionId: session.id,
            plan,
            slot: parsed.value.slot,
          });
        } catch (error) {
          console.error('Stripe session creation failed', error);
          return Response.json({ error: 'Unable to start checkout.' }, { status: 502 });
        }
      },

      // Verify a Checkout Session after the redirect back to the site.
      GET: async ({ request, context }) => {
        const secretKey = await readServerSecret('STRIPE_SECRET_KEY', context);
        if (!secretKey) {
          return Response.json(
            { error: 'Checkout is not configured on this deployment.' },
            { status: 503 },
          );
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
        const priceIds = await resolvePlanPriceIds(fetch, {
          secretKey,
          pricingTableId,
          configured,
        });
        try {
          const session = await retrieveCheckoutSession(fetch, { secretKey, sessionId });
          const verified = verifyCheckoutSession(session, { priceIds });
          // The payment is confirmed here, so the lead and the confirmation
          // email are created from a session Stripe says is paid. This is the
          // fallback for the Stripe webhook: it runs the same idempotent
          // path, so a buyer is never charged twice for the same session and
          // never receives two confirmations.
          const origin =
            (await readServerSecret('PUBLIC_APP_URL', context)) ?? new URL(request.url).origin;
          const confirmation = await confirmPartnerPayment(session, context, { priceIds, origin });
          return Response.json({
            ...verified,
            receipt: confirmation?.receipt ?? null,
            emailed: confirmation?.emailed ?? false,
            email: confirmation?.email ?? verified.email,
            ...(confirmation?.error ? { confirmationError: confirmation.error } : {}),
          });
        } catch (error) {
          console.error('Stripe session lookup failed', error);
          return Response.json({ error: 'Unable to verify checkout.' }, { status: 502 });
        }
      },
    },
  },
});
