import { createFileRoute } from '@tanstack/react-router';
import { confirmPartnerPayment } from '@/lib/partnerCheckout';
import { readServerSecret } from '@/lib/serverEnv';
import { retrieveCheckoutSession, verifyStripeSignature } from '@/lib/stripe';

/**
 * The Stripe webhook.
 *
 * The buyer is redirected back to the site after the payment, and that
 * redirect is what confirms a purchase today. A buyer who closes the tab
 * before it finishes would leave a paid slot with no lead and no
 * confirmation, so Stripe also tells the server directly.
 *
 * The signature is checked against the raw body before anything is read from
 * it, and the session is fetched from Stripe rather than trusted from the
 * payload. The handler is idempotent: the lead records that the confirmation
 * has been sent, so a webhook and a redirect cannot both email the merchant.
 */
export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const secretKey = await readServerSecret('STRIPE_SECRET_KEY', context);
        if (!secretKey) {
          return Response.json(
            { error: 'Checkout is not configured on this deployment.' },
            { status: 503 },
          );
        }
        const webhookSecret = await readServerSecret('STRIPE_WEBHOOK_SECRET', context);
        if (!webhookSecret) {
          return Response.json(
            { error: 'Stripe webhooks are not configured on this deployment.' },
            { status: 503 },
          );
        }

        // The raw body is what Stripe signed, so it cannot be parsed first.
        const rawBody = await request.text();
        const signature = request.headers.get('stripe-signature');
        const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
        if (!valid) {
          return Response.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
        }

        let event: { type?: string; data?: { object?: { id?: string } } };
        try {
          event = JSON.parse(rawBody) as typeof event;
        } catch {
          return Response.json({ error: 'Invalid webhook payload.' }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
          const sessionId = event.data?.object?.id;
          if (sessionId) {
            try {
              // The session is read from Stripe, not taken from the payload.
              const session = await retrieveCheckoutSession(fetch, { secretKey, sessionId });
              const origin =
                (await readServerSecret('PUBLIC_APP_URL', context)) ?? new URL(request.url).origin;
              const confirmation = await confirmPartnerPayment(session, context, { origin });
              return Response.json({
                received: true,
                sessionId,
                leadId: confirmation?.leadId ?? null,
                emailed: confirmation?.emailed ?? false,
                ...(confirmation?.error ? { error: confirmation.error } : {}),
              });
            } catch (error) {
              console.error('Stripe webhook handling failed', error);
              // A 500 makes Stripe retry, so the payment is never left
              // unconfirmed because of a transient failure.
              return Response.json({ error: 'Unable to confirm the payment.' }, { status: 500 });
            }
          }
        }

        return Response.json({ received: true });
      },
    },
  },
});
