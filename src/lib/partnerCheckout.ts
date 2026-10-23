// The closed loop of a partner purchase.
//
// A merchant scans the QR code on a sales flyer, lands on /partner, picks a
// station and a slot, and pays. When the payment is confirmed the program
// owes the merchant two things:
//
//   1. A lead in the partner portal, so the team has something to approve
//      inside the promised 24 hours.
//   2. A confirmation email, so the merchant knows the payment landed.
//
// Both are derived from the Stripe session alone, which means they happen even
// if the buyer closes the tab before the redirect finishes. The Stripe webhook
// is the primary trigger and the verification call after the redirect is the
// fallback; both run through here, and the lead records that the
// confirmation has already gone out, so the merchant is never emailed twice.

import { findStation } from '@/data/transit';
import { intakeReceiptId } from '@/data/merchantIntake';
import { addLead, findLeadBySessionId, updateLead, type AnchorLead } from '@/lib/anchorStore';
import { sendPartnerConfirmationEmail } from '@/lib/email';
import {
  isPaidSession,
  sessionEmail,
  verifyCheckoutSession,
  type AnchorPlan,
  type AnchorSlot,
  type StripeSession,
} from '@/lib/stripe';

export type PartnerConfirmation = {
  /** The lead the admin portal approves. */
  leadId: string;
  /** The receipt code the merchant can quote. */
  receipt: string;
  /** True once the confirmation email has been delivered. */
  emailed: boolean;
  /** Which transport delivered it. */
  transport: string | null;
  /** Where it went. */
  email: string | null;
  /** Why it was not delivered, when it was not. */
  error?: string;
};

/** The plan a slot falls back to when the session carries none. */
function defaultPlan(slot: AnchorSlot): AnchorPlan {
  return slot === 1 ? 'annual' : 'monthly';
}

/**
 * Records the purchase and sends the confirmation.
 *
 * Returns null when the session is not a paid checkout or carries no station
 * attribution, because there is nothing the program can act on.
 */
export async function confirmPartnerPayment(
  session: StripeSession,
  context?: unknown,
  options?: {
    priceIds?: Partial<Record<AnchorPlan, string>>;
    /** The public address of the deployment, for the logo and the link. */
    origin?: string;
  },
): Promise<PartnerConfirmation | null> {
  // The payment is only ever confirmed by Stripe, never by the query string.
  if (!isPaidSession(session)) return null;

  const verified = verifyCheckoutSession(
    session,
    options?.priceIds ? { priceIds: options.priceIds } : undefined,
  );
  const stationId = verified.stationId;
  const slot = verified.slot;
  if (!stationId || !slot) return null;

  const email = sessionEmail(session);
  const businessName = verified.businessName ?? 'DPM - Go! partner';
  const contactName = verified.contactName ?? businessName;
  const deal = verified.deal ?? 'Featured rider perk to be confirmed';
  const plan = verified.plan ?? defaultPlan(slot);

  // One lead per paid session: the id is the session id, so a webhook and the
  // verification call can never create two.
  const existing = await findLeadBySessionId(session.id, context);
  const lead: AnchorLead = existing ?? {
    id: session.id,
    receipt: intakeReceiptId({ businessName, stationId, slot }),
    contactName,
    businessName,
    email: email ?? '',
    ...(verified.phone ? { phone: verified.phone } : {}),
    ...(verified.website ? { website: verified.website } : {}),
    stationId,
    slot,
    plan,
    deal,
    status: 'pending',
    createdAt: new Date().toISOString(),
    sessionId: session.id,
    ...(typeof verified.amountTotal === 'number' ? { paidAmountCents: verified.amountTotal } : {}),
    ...(session.metadata['agreementVersion']
      ? { agreementVersion: session.metadata['agreementVersion'] }
      : {}),
    ...(session.metadata['agreementAcceptedAt']
      ? { agreementAcceptedAt: session.metadata['agreementAcceptedAt'] }
      : {}),
  };

  if (!existing) await addLead(lead, context);

  // The confirmation goes out once per session.
  if (lead.receiptSentAt) {
    return {
      leadId: lead.id,
      receipt: lead.receipt,
      emailed: true,
      transport: lead.receiptTransport ?? null,
      email: lead.email || null,
    };
  }

  if (!email) {
    // The lead is recorded, so the team can still reach the merchant.
    return {
      leadId: lead.id,
      receipt: lead.receipt,
      emailed: false,
      transport: null,
      email: null,
      error: 'The checkout session carried no email address.',
    };
  }

  const result = await sendPartnerConfirmationEmail(
    {
      to: email,
      businessName,
      stationName: findStation(stationId)?.name ?? stationId,
      slot,
      plan,
      receipt: lead.receipt,
      sessionId: session.id,
      origin: options?.origin ?? '',
    },
    context,
  );

  if (result.sent) {
    lead.receiptSentAt = new Date().toISOString();
    if (result.transport) lead.receiptTransport = result.transport;
    await updateLead(lead, context);
  }

  return {
    leadId: lead.id,
    receipt: lead.receipt,
    emailed: result.sent,
    transport: result.transport,
    email,
    ...(result.error ? { error: result.error } : {}),
  };
}
