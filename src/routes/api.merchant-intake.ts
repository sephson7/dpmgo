import { createFileRoute } from '@tanstack/react-router';
import { intakeReceiptId, parseMerchantIntake } from '@/data/merchantIntake';
import { addLead, type AnchorLead } from '@/lib/anchorStore';
import { readServerSecret } from '@/lib/serverEnv';

export const Route = createFileRoute('/api/merchant-intake')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        if (origin && host) {
          try {
            if (new URL(origin).host !== host) {
              return Response.json(
                { error: 'Cross-origin requests are not allowed.' },
                { status: 403 },
              );
            }
          } catch {
            return Response.json(
              { error: 'Cross-origin requests are not allowed.' },
              { status: 403 },
            );
          }
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: 'Invalid intake request.' }, { status: 400 });
        }

        const parsed = parseMerchantIntake(payload);
        if (!parsed.ok) {
          return Response.json(
            { error: parsed.error, fieldErrors: parsed.fieldErrors ?? {} },
            { status: 400 },
          );
        }

        const receipt = intakeReceiptId(parsed.value);
        const lead: AnchorLead = {
          // The receipt is the human facing code, the id stays unique per submission.
          id: `${receipt}-${Date.now().toString(36).toUpperCase()}`,
          receipt,
          contactName: parsed.value.contactName,
          businessName: parsed.value.businessName,
          email: parsed.value.email,
          ...(parsed.value.phone ? { phone: parsed.value.phone } : {}),
          ...(parsed.value.website ? { website: parsed.value.website } : {}),
          stationId: parsed.value.stationId || 'unassigned',
          slot: parsed.value.slot === 0 ? 1 : parsed.value.slot,
          plan: parsed.value.slot === 1 ? 'annual' : 'monthly',
          deal: parsed.value.deal,
          ...(parsed.value.notes ? { notes: parsed.value.notes } : {}),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        await addLead(lead, context);

        // Forward the lead to the CRM webhook when one is configured.
        const webhook = await readServerSecret('MERCHANT_INTAKE_WEBHOOK_URL');
        if (webhook) {
          try {
            await fetch(webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receipt, ...parsed.value, receivedAt: lead.createdAt }),
            });
          } catch (error) {
            console.error('Merchant intake webhook failed', error);
          }
        }

        return Response.json({ ok: true, receipt });
      },
    },
  },
});
