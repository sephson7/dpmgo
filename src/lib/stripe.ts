// Server-side Stripe integration for station anchor slots.
// The secret key never leaves the server: the browser asks for a Checkout
// Session, the server decides the price and the metadata.

export type AnchorSlot = 1 | 2;

/** The two plans published on the Stripe pricing table. */
export type AnchorPlan = 'monthly' | 'annual';

export type PlanProduct = {
  plan: AnchorPlan;
  label: string;
  /** Published price in cents: $375 per month, $1,875 per year. */
  amountCents: number;
  /** Environment variable that holds the Stripe price id for this plan. */
  priceEnvVar: string;
};

export const PLAN_PRODUCTS: Record<AnchorPlan, PlanProduct> = {
  monthly: {
    plan: 'monthly',
    label: 'Anchor Partnership · Monthly ($375 / month)',
    amountCents: 37_500,
    priceEnvVar: 'STRIPE_PRICE_MONTHLY',
  },
  annual: {
    plan: 'annual',
    label: 'Anchor Partnership · Annual ($1,875 / year)',
    amountCents: 187_500,
    priceEnvVar: 'STRIPE_PRICE_ANNUAL',
  },
};

/**
 * Which plan a slot can be bought on.
 * Slot 1 is the annual partner slot: the annual option only.
 * Slot 2 is the rotating slot: both the monthly and the annual option.
 */
export const SLOT_PLAN_RULES: Record<AnchorSlot, AnchorPlan[]> = {
  1: ['annual'],
  2: ['monthly', 'annual'],
};

export function plansAllowedForSlot(slot: AnchorSlot): AnchorPlan[] {
  return SLOT_PLAN_RULES[slot] ?? ['monthly', 'annual'];
}

export function slotAcceptsPlan(slot: AnchorSlot, plan: AnchorPlan): boolean {
  return plansAllowedForSlot(slot).includes(plan);
}

export const SLOT_LABELS: Record<AnchorSlot, string> = {
  1: 'Annual anchor slot',
  2: 'Rotating anchor slot',
};

/**
 * The page a merchant lands on. The QR code on the sales flyer points here and
 * Stripe sends the buyer back here after the payment, so the whole flow has
 * one canonical address.
 */
export const PARTNER_PATH = '/partner';

/** The Stripe pricing table that owns the published prices. */
export const PRICING_TABLE_ID = 'prctbl_1UQ9Ky57MO63Hzo12cFECrWf';
export const PRICING_TABLE_PUBLISHABLE_KEY =
  'pk_live_51UQ8Q957MO63Hzo1kKCL8z2xUtv75B87HNnp6Hd99EPMYlltLeUMNuCYUd1HhCoeFQT7G3irEuFkU7GiPedJ5Sek00Q16TKFlW';

export type CheckoutRequestBody = {
  stationId: string;
  slot: AnchorSlot;
  plan?: AnchorPlan;
  placeId?: string;
  email?: string;
  /** The merchant details the confirmation email and the lead are built from. */
  businessName?: string;
  contactName?: string;
  phone?: string;
  website?: string;
  /** The rider perk the partner wants to run in the slot. */
  deal?: string;
};

export type ParseResult = { ok: true; value: CheckoutRequestBody } | { ok: false; error: string };

const STATION_ID_PATTERN = /^[a-z0-9-]{2,64}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A trimmed string of at most `max` characters, or undefined when it is empty. */
function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/** Validates the payload coming from the browser. Prices are never trusted. */
export function parseCheckoutRequest(payload: unknown): ParseResult {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'Invalid checkout request.' };
  }
  const record = payload as Record<string, unknown>;
  const stationId = typeof record['stationId'] === 'string' ? record['stationId'].trim() : '';
  const slot = record['slot'];
  if (!STATION_ID_PATTERN.test(stationId)) {
    return { ok: false, error: 'A valid station is required.' };
  }
  if (slot !== 1 && slot !== 2) {
    return { ok: false, error: 'Slot must be 1 (annual) or 2 (rotating).' };
  }
  // The merchant details are collected before the payment, because the
  // confirmation email goes out the moment the payment is confirmed and it
  // needs a recipient.
  const businessName = cleanText(record['businessName'], 80);
  if (!businessName || businessName.length < 2) {
    return { ok: false, error: 'Enter the name of your restaurant or business.' };
  }
  const email = cleanText(record['email'], 120);
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Enter a valid email address so we can send your confirmation.' };
  }
  const plan = record['plan'];
  const placeId = cleanText(record['placeId'], 64);
  const contactName = cleanText(record['contactName'], 80);
  const phone = cleanText(record['phone'], 30);
  const website = cleanText(record['website'], 200);
  const deal = cleanText(record['deal'], 160);
  return {
    ok: true,
    value: {
      stationId,
      slot,
      ...(plan === 'monthly' || plan === 'annual' ? { plan } : {}),
      ...(placeId && STATION_ID_PATTERN.test(placeId) ? { placeId } : {}),
      email,
      businessName,
      ...(contactName ? { contactName } : {}),
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      ...(deal ? { deal } : {}),
    },
  };
}

export type StripeSession = {
  id: string;
  url: string | null;
  status: string | null;
  payment_status: string;
  client_reference_id: string | null;
  metadata: Record<string, string>;
  amount_total?: number;
  /** The address the buyer entered in the Stripe form. */
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
};

export type SessionFormOptions = {
  origin: string;
  body: CheckoutRequestBody;
  priceId?: string;
  plan: AnchorPlan;
  /** Pricing table that owns the published price, when the plan comes from it. */
  pricingTableId?: string;
};

/**
 * Builds the Stripe Checkout Session form body. The slot decides the plan and
 * the metadata, so a client can never ask for a different price.
 */
export function buildSessionForm({
  origin,
  body,
  priceId,
  plan,
  pricingTableId,
}: SessionFormOptions): URLSearchParams {
  const form = new URLSearchParams();
  const product = PLAN_PRODUCTS[plan];
  // Published prices are recurring, so they need a subscription session.
  form.set('mode', priceId ? 'subscription' : 'payment');
  form.set('line_items[0][quantity]', '1');
  if (priceId) {
    form.set('line_items[0][price]', priceId);
  } else {
    // No price id resolved: fall back to inline price data for the plan.
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(product.amountCents));
    form.set('line_items[0][price_data][product_data][name]', product.label);
  }
  const base = origin.replace(/\/+$/, '');
  form.set('success_url', `${base}${PARTNER_PATH}?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${base}${PARTNER_PATH}?canceled=1`);
  // The buyer can change the address, but it starts out filled in.
  if (body.email) form.set('customer_email', body.email);
  // The session reference always carries the attribution, in both modes.
  form.set('client_reference_id', `${body.stationId}|${body.slot}|${plan}`);
  form.set('metadata[stationId]', body.stationId);
  form.set('metadata[slot]', String(body.slot));
  form.set('metadata[plan]', plan);
  // The merchant details travel with the session, so the confirmation email
  // and the lead can be built from the confirmed payment alone.
  if (body.businessName) form.set('metadata[businessName]', body.businessName);
  if (body.contactName) form.set('metadata[contactName]', body.contactName);
  if (body.email) form.set('metadata[email]', body.email);
  if (body.phone) form.set('metadata[phone]', body.phone);
  if (body.website) form.set('metadata[website]', body.website);
  if (body.deal) form.set('metadata[deal]', body.deal);
  if (priceId) {
    form.set('subscription_data[metadata][stationId]', body.stationId);
    form.set('subscription_data[metadata][slot]', String(body.slot));
    form.set('subscription_data[metadata][plan]', plan);
    if (body.businessName) form.set('subscription_data[metadata][businessName]', body.businessName);
    if (body.contactName) form.set('subscription_data[metadata][contactName]', body.contactName);
    if (body.email) form.set('subscription_data[metadata][email]', body.email);
    if (body.deal) form.set('subscription_data[metadata][deal]', body.deal);
  }
  if (pricingTableId) {
    // Kept for traceability only: the pricing table id is not a session parameter.
    form.set('metadata[pricingTableId]', pricingTableId);
  }
  if (body.placeId) form.set('metadata[placeId]', body.placeId);
  return form;
}

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeRequest(
  fetchImpl: typeof fetch,
  secretKey: string,
  path: string,
  init: { method: 'GET' | 'POST'; body?: URLSearchParams },
): Promise<unknown> {
  const response = await fetchImpl(`${STRIPE_API}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(init.body ? { body: init.body.toString() } : {}),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Stripe request failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return response.json();
}

export async function createCheckoutSession(
  fetchImpl: typeof fetch,
  options: {
    secretKey: string;
    origin: string;
    body: CheckoutRequestBody;
    priceId?: string;
    pricingTableId?: string;
  },
): Promise<StripeSession> {
  const plan = options.body.plan ?? plansAllowedForSlot(options.body.slot)[0] ?? 'annual';
  const form = buildSessionForm({
    origin: options.origin,
    body: options.body,
    plan,
    ...(options.priceId ? { priceId: options.priceId } : {}),
    ...(options.pricingTableId ? { pricingTableId: options.pricingTableId } : {}),
  });
  return (await stripeRequest(fetchImpl, options.secretKey, '/checkout/sessions', {
    method: 'POST',
    body: form,
  })) as StripeSession;
}

type StripePrice = {
  id: string;
  unit_amount?: number | null;
  active?: boolean;
  recurring?: { interval?: string } | null;
};

/**
 * Resolves the Stripe price ids published on the pricing table so the
 * checkout uses exactly the prices the buyer sees. Falls back to the
 * configured price ids when the key cannot read the catalogue.
 */
export async function resolvePlanPriceIds(
  fetchImpl: typeof fetch,
  options: {
    secretKey: string;
    pricingTableId: string;
    configured?: Partial<Record<AnchorPlan, string>>;
  },
): Promise<Partial<Record<AnchorPlan, string>>> {
  const found: Partial<Record<AnchorPlan, string>> = { ...(options.configured ?? {}) };

  // 1. The pricing table points at the product that carries the published prices.
  try {
    const table = (await stripeRequest(
      fetchImpl,
      options.secretKey,
      `/pricing_tables/${encodeURIComponent(options.pricingTableId)}`,
      {
        method: 'GET',
      },
    )) as { product?: string; data?: { product?: string }[] };
    const product = table?.product ?? table?.data?.[0]?.product;
    if (product) {
      const prices = (await stripeRequest(
        fetchImpl,
        options.secretKey,
        `/prices?product=${encodeURIComponent(product)}&active=true&limit=100`,
        { method: 'GET' },
      )) as { data?: StripePrice[] };
      collectPlanPrices(prices.data, found);
    }
  } catch {
    // Restricted keys cannot read pricing tables. The catalogue is read below.
  }

  // 2. Fall back to the published catalogue, matched on amount and interval.
  if (!found.monthly || !found.annual) {
    try {
      const prices = (await stripeRequest(
        fetchImpl,
        options.secretKey,
        '/prices?active=true&limit=100',
        {
          method: 'GET',
        },
      )) as { data?: StripePrice[] };
      collectPlanPrices(prices.data, found);
    } catch {
      // Use whatever was configured.
    }
  }

  return found;
}

function collectPlanPrices(
  prices: StripePrice[] | undefined,
  found: Partial<Record<AnchorPlan, string>>,
): void {
  for (const price of prices ?? []) {
    if (price.active === false) continue;
    const interval = price.recurring?.interval;
    if (interval === 'year' || price.unit_amount === PLAN_PRODUCTS.annual.amountCents) {
      found.annual ??= price.id;
    }
    if (interval === 'month' || price.unit_amount === PLAN_PRODUCTS.monthly.amountCents) {
      found.monthly ??= price.id;
    }
  }
}

export async function retrieveCheckoutSession(
  fetchImpl: typeof fetch,
  options: { secretKey: string; sessionId: string },
): Promise<StripeSession> {
  return (await stripeRequest(
    fetchImpl,
    options.secretKey,
    `/checkout/sessions/${encodeURIComponent(options.sessionId)}`,
    {
      method: 'GET',
    },
  )) as StripeSession;
}

/** A session only counts as paid when Stripe says so. */
export function isPaidSession(session: StripeSession): boolean {
  return session.payment_status === 'paid' && session.status === 'complete';
}

/** Works out which published plan a session bought. */
export function planFromSession(
  session: StripeSession,
  priceIds?: Partial<Record<AnchorPlan, string>>,
): AnchorPlan | null {
  if (priceIds?.monthly && session.metadata['priceId'] === priceIds.monthly) return 'monthly';
  if (priceIds?.annual && session.metadata['priceId'] === priceIds.annual) return 'annual';
  const total = session.amount_total;
  if (typeof total === 'number') {
    if (total === PLAN_PRODUCTS.annual.amountCents) return 'annual';
    if (total === PLAN_PRODUCTS.monthly.amountCents) return 'monthly';
  }
  const metadataPlan = session.metadata['plan'];
  return metadataPlan === 'monthly' || metadataPlan === 'annual' ? metadataPlan : null;
}

export type VerifiedCheckout = {
  paid: boolean;
  sessionId: string;
  stationId: string | null;
  slot: AnchorSlot | null;
  plan: AnchorPlan | null;
  /** False when the purchased plan is not allowed for the slot that was bought. */
  slotPlanAllowed: boolean;
  amountTotal: number | null;
  businessName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  deal: string | null;
};

/** The address the buyer used, wherever it was captured. */
export function sessionEmail(session: StripeSession): string | null {
  const candidate =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    session.metadata['email']?.trim() ||
    '';
  return EMAIL_PATTERN.test(candidate) ? candidate : null;
}

/** Turns a Stripe session into the receipt shown after checkout. */
export function verifyCheckoutSession(
  session: StripeSession,
  options?: { priceIds?: Partial<Record<AnchorPlan, string>> },
): VerifiedCheckout {
  // Attribution lives on the session reference so it survives both checkout
  // modes, with the metadata as a fallback.
  const [refStation, refSlot, refPlan] = (session.client_reference_id ?? '').split('|');
  const slotValue = Number(session.metadata['slot'] ?? refSlot);
  const slot = slotValue === 1 || slotValue === 2 ? slotValue : null;
  const metadataPlan = session.metadata['plan'] ?? refPlan;
  const plan =
    metadataPlan === 'monthly' || metadataPlan === 'annual'
      ? metadataPlan
      : planFromSession(session, options?.priceIds);
  const paid = isPaidSession(session);
  const text = (value: string | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };
  return {
    paid,
    sessionId: session.id,
    stationId: session.metadata['stationId'] ?? refStation ?? null,
    slot,
    plan,
    slotPlanAllowed: slot === null || plan === null ? true : slotAcceptsPlan(slot, plan),
    amountTotal: typeof session.amount_total === 'number' ? session.amount_total : null,
    businessName: text(session.metadata['businessName']),
    contactName: text(session.metadata['contactName']),
    email: sessionEmail(session),
    phone: text(session.metadata['phone']),
    website: text(session.metadata['website']),
    deal: text(session.metadata['deal']),
  };
}

/* ------------------------------------------------------------- webhooks */

/** Hex HMAC-SHA256 of a payload, using the Web Crypto API. */
async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Compares two hex strings without leaking where they differ. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/**
 * Verifies a Stripe webhook signature over the raw request body.
 *
 * The body has to be the exact bytes Stripe signed, so it cannot be parsed
 * before it is checked.
 */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  options?: { toleranceSeconds?: number; now?: number },
): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  const now = options?.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - seconds) > (options?.toleranceSeconds ?? 300)) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((candidate) => timingSafeEqual(expected, candidate));
}
