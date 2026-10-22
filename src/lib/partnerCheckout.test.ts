import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StripeSession } from '@/lib/stripe';

/** A minimal stand in for the Workers KV binding. */
function fakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list({ prefix = '' }: { prefix?: string } = {}) {
      const keys = [...store.keys()]
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys, keys_complete: true, list_complete: true } as {
        keys: { name: string }[];
        list_complete: boolean;
      };
    },
  };
}

const contextWith = (kv: unknown) => ({ cloudflare: { env: { ANCHOR_STORE: kv } } });

const paidSession = (overrides: Partial<StripeSession> = {}): StripeSession => ({
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/x',
  status: 'complete',
  payment_status: 'paid',
  client_reference_id: 'fort-cass|1|annual',
  metadata: {
    stationId: 'fort-cass',
    slot: '1',
    plan: 'annual',
    businessName: 'Lafayette Coney Island',
    contactName: 'Sam Carter',
    email: 'sam@lafayette.example',
    deal: '10% off with People Mover ride proof',
  },
  amount_total: 187_500,
  ...overrides,
});

describe('confirming a partner payment', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env['PARTNER_EMAIL_WEBHOOK_URL'];
    // These tests exercise the fallback transports, never the live sender.
    vi.stubEnv('LOVABLE_API_KEY', '');
  });

  it('records the lead and sends the confirmation', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    const sent: { to: string; subject: string; html: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: unknown, init: { body: string }) => {
        sent.push(JSON.parse(init.body) as { to: string; subject: string; html: string });
        return new Response('{}', { status: 200 });
      }),
    );
    process.env['PARTNER_EMAIL_WEBHOOK_URL'] = 'https://mailer.test/hook';

    const { confirmPartnerPayment } = await import('@/lib/partnerCheckout');
    const { listLeads } = await import('@/lib/anchorStore');

    const result = await confirmPartnerPayment(paidSession(), context, {
      origin: 'https://dpmgo.lovable.app',
    });

    expect(result?.emailed).toBe(true);
    expect(result?.email).toBe('sam@lafayette.example');
    expect(result?.receipt).toMatch(/^DPM-/);

    // The merchant got the promise, branded with the logo.
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe('sam@lafayette.example');
    expect(sent[0]?.html).toContain('Welcome to the DPM - Go! Partnership Program!');
    expect(sent[0]?.html).toContain('icon-512.png');

    // And the team has a lead to approve.
    const leads = await listLeads(context);
    expect(leads).toHaveLength(1);
    expect(leads[0]?.businessName).toBe('Lafayette Coney Island');
    expect(leads[0]?.stationId).toBe('fort-cass');
    expect(leads[0]?.slot).toBe(1);
    expect(leads[0]?.status).toBe('pending');
    expect(leads[0]?.receiptSentAt).toBeTruthy();
  });

  it('never emails the merchant twice, however often it is confirmed', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    let sent = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        sent += 1;
        return new Response('{}', { status: 200 });
      }),
    );
    process.env['PARTNER_EMAIL_WEBHOOK_URL'] = 'https://mailer.test/hook';

    const { confirmPartnerPayment } = await import('@/lib/partnerCheckout');
    const { listLeads } = await import('@/lib/anchorStore');

    // The webhook fires and the buyer also comes back through the redirect.
    await confirmPartnerPayment(paidSession(), context, { origin: 'https://dpmgo.lovable.app' });
    await confirmPartnerPayment(paidSession(), context, { origin: 'https://dpmgo.lovable.app' });
    await confirmPartnerPayment(paidSession(), context, { origin: 'https://dpmgo.lovable.app' });

    expect(sent).toBe(1);
    expect(await listLeads(context)).toHaveLength(1);
  });

  it('ignores a session Stripe has not confirmed as paid', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    );
    process.env['PARTNER_EMAIL_WEBHOOK_URL'] = 'https://mailer.test/hook';

    const { confirmPartnerPayment } = await import('@/lib/partnerCheckout');
    const { listLeads } = await import('@/lib/anchorStore');

    const unpaid = await confirmPartnerPayment(paidSession({ payment_status: 'unpaid' }), context, {
      origin: 'https://dpmgo.lovable.app',
    });
    expect(unpaid).toBeNull();
    expect(await listLeads(context)).toHaveLength(0);
  });

  it('ignores a session with no station to credit', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    );
    process.env['PARTNER_EMAIL_WEBHOOK_URL'] = 'https://mailer.test/hook';

    const { confirmPartnerPayment } = await import('@/lib/partnerCheckout');
    const { listLeads } = await import('@/lib/anchorStore');

    const result = await confirmPartnerPayment(
      paidSession({ client_reference_id: '', metadata: {} }),
      context,
      { origin: 'https://dpmgo.lovable.app' },
    );
    expect(result).toBeNull();
    expect(await listLeads(context)).toHaveLength(0);
  });

  it('keeps the lead when no email transport is configured', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    const { confirmPartnerPayment } = await import('@/lib/partnerCheckout');
    const { listLeads } = await import('@/lib/anchorStore');

    const result = await confirmPartnerPayment(paidSession(), context, {
      origin: 'https://dpmgo.lovable.app',
    });

    // The purchase is still recorded, so the team can follow up by hand.
    expect(result?.emailed).toBe(false);
    expect(result?.error).toBeTruthy();
    const leads = await listLeads(context);
    expect(leads).toHaveLength(1);
    expect(leads[0]?.receiptSentAt).toBeUndefined();
  });
});
