import { describe, expect, it } from 'vitest';
import {
  PARTNER_PATH,
  buildSessionForm,
  parseCheckoutRequest,
  plansAllowedForSlot,
  slotAcceptsPlan,
  verifyCheckoutSession,
  verifyStripeSignature,
  type StripeSession,
} from '@/lib/stripe';

const validBody = {
  stationId: 'fort-cass',
  slot: 1 as const,
  plan: 'annual' as const,
  businessName: 'Lafayette Coney Island',
  contactName: 'Sam Carter',
  email: 'sam@lafayette.example',
  deal: '10% off with People Mover ride proof',
};

describe('the partner checkout request', () => {
  it('accepts a complete merchant', () => {
    const parsed = parseCheckoutRequest(validBody);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.stationId).toBe('fort-cass');
    expect(parsed.value.businessName).toBe('Lafayette Coney Island');
    expect(parsed.value.email).toBe('sam@lafayette.example');
  });

  it('needs an email, because the confirmation goes to it', () => {
    const parsed = parseCheckoutRequest({ ...validBody, email: '' });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/email/i);
  });

  it('needs a business name, because the lead and the email carry it', () => {
    const parsed = parseCheckoutRequest({ ...validBody, businessName: '  ' });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/restaurant or business/i);
  });

  it('rejects an unknown station and an unknown slot', () => {
    expect(parseCheckoutRequest({ ...validBody, stationId: 'Not A Station' }).ok).toBe(false);
    expect(parseCheckoutRequest({ ...validBody, slot: 3 }).ok).toBe(false);
  });

  it('keeps slot 1 on the annual plan only', () => {
    expect(plansAllowedForSlot(1)).toEqual(['annual']);
    expect(slotAcceptsPlan(1, 'annual')).toBe(true);
    expect(slotAcceptsPlan(1, 'monthly')).toBe(false);
    expect(slotAcceptsPlan(2, 'monthly')).toBe(true);
  });
});

describe('the Stripe session form', () => {
  const form = (overrides: Partial<typeof validBody> = {}) =>
    buildSessionForm({
      origin: 'https://dpmgo.lovable.app',
      body: { ...validBody, ...overrides },
      plan: 'annual',
    });

  it('sends the buyer back to the partner page', () => {
    const body = form();
    expect(body.get('success_url')).toBe(
      `https://dpmgo.lovable.app${PARTNER_PATH}?session_id={CHECKOUT_SESSION_ID}`,
    );
    expect(body.get('cancel_url')).toBe(`https://dpmgo.lovable.app${PARTNER_PATH}?canceled=1`);
  });

  it('carries the attribution and the merchant on the session', () => {
    const body = form();
    expect(body.get('client_reference_id')).toBe('fort-cass|1|annual');
    expect(body.get('metadata[stationId]')).toBe('fort-cass');
    expect(body.get('metadata[slot]')).toBe('1');
    expect(body.get('metadata[plan]')).toBe('annual');
    expect(body.get('metadata[businessName]')).toBe('Lafayette Coney Island');
    expect(body.get('metadata[email]')).toBe('sam@lafayette.example');
  });

  it('prefills the buyer email so it does not have to be typed twice', () => {
    expect(form().get('customer_email')).toBe('sam@lafayette.example');
  });

  it('never takes a price from the client', () => {
    const body = buildSessionForm({
      origin: 'https://dpmgo.lovable.app',
      body: { ...validBody, slot: 2, plan: 'monthly' },
      plan: 'monthly',
      priceId: 'price_from_the_catalogue',
    });
    expect(body.get('line_items[0][price]')).toBe('price_from_the_catalogue');
    expect(body.get('line_items[0][price_data][unit_amount]')).toBeNull();
  });
});

describe('verifying a checkout session', () => {
  const session = (overrides: Partial<StripeSession> = {}): StripeSession => ({
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
      email: 'sam@lafayette.example',
    },
    amount_total: 187_500,
    ...overrides,
  });

  it('is only paid when Stripe says so', () => {
    expect(verifyCheckoutSession(session()).paid).toBe(true);
    expect(verifyCheckoutSession(session({ payment_status: 'unpaid' })).paid).toBe(false);
    expect(verifyCheckoutSession(session({ status: 'open' })).paid).toBe(false);
  });

  it('reads the merchant back off the session', () => {
    const verified = verifyCheckoutSession(session());
    expect(verified.stationId).toBe('fort-cass');
    expect(verified.slot).toBe(1);
    expect(verified.plan).toBe('annual');
    expect(verified.businessName).toBe('Lafayette Coney Island');
    expect(verified.email).toBe('sam@lafayette.example');
  });

  it('prefers the address the buyer typed into the Stripe form', () => {
    const verified = verifyCheckoutSession(
      session({ customer_details: { email: 'buyer@example.com' } }),
    );
    expect(verified.email).toBe('buyer@example.com');
  });

  it('flags a session that broke the slot and plan rule', () => {
    const verified = verifyCheckoutSession(
      session({ metadata: { stationId: 'fort-cass', slot: '1', plan: 'monthly' } }),
    );
    expect(verified.slotPlanAllowed).toBe(false);
  });
});

describe('verifying a Stripe webhook signature', () => {
  const secret = 'whsec_test_secret';
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });

  const sign = async (payload: string, key = secret) => {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  it('accepts a signature Stripe made', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const v1 = await sign(`${timestamp}.${body}`);
    const header = `t=${timestamp},v1=${v1}`;
    await expect(verifyStripeSignature(body, header, secret)).resolves.toBe(true);
  });

  it('rejects a body that was changed after it was signed', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const v1 = await sign(`${timestamp}.${body}`);
    const header = `t=${timestamp},v1=${v1}`;
    await expect(verifyStripeSignature(`${body} tampered`, header, secret)).resolves.toBe(false);
  });

  it('rejects a signature made with the wrong secret', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const v1 = await sign(`${timestamp}.${body}`, 'whsec_other');
    const header = `t=${timestamp},v1=${v1}`;
    await expect(verifyStripeSignature(body, header, secret)).resolves.toBe(false);
  });

  it('rejects a stale signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 4000;
    const v1 = await sign(`${timestamp}.${body}`);
    const header = `t=${timestamp},v1=${v1}`;
    await expect(verifyStripeSignature(body, header, secret)).resolves.toBe(false);
  });

  it('rejects a missing header', async () => {
    await expect(verifyStripeSignature(body, null, secret)).resolves.toBe(false);
  });
});
