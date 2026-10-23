// Protection of an exclusive annual term.
//
// An annual placement holds its station slot for 12 months from approval.
// While that term is running, the server refuses a new checkout and refuses
// an admin approval for the same station and slot, so a competitor can never
// take over an annual partner's slot early. Pure, so it is shared by the
// checkout, the admin portal and the partner page.

export type ExclusiveHoldInput = {
  stationId: string;
  slot: 1 | 2;
  kind: 'annual' | 'rotating';
  assignedAt: string;
  leadId?: string;
  businessName?: string;
  termEndsAt?: string;
};

/** When an assignment's exclusive annual term ends, or null for a non-annual one. */
export function exclusiveTermEnd(assignment: ExclusiveHoldInput): Date | null {
  if (assignment.termEndsAt) {
    const end = new Date(assignment.termEndsAt);
    return Number.isNaN(end.getTime()) ? null : end;
  }
  if (assignment.kind !== 'annual') return null;
  const start = new Date(assignment.assignedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end;
}

/** The term end for an approval made now on the given plan. */
export function termEndForPlan(plan: 'monthly' | 'annual', from: Date): string | undefined {
  if (plan !== 'annual') return undefined;
  const end = new Date(from);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end.toISOString();
}

/** The assignment whose exclusive term still covers this station slot, if any. */
export function activeExclusiveHold<T extends ExclusiveHoldInput>(
  assignments: readonly T[],
  stationId: string,
  slot: 1 | 2,
  now: Date = new Date(),
): T | null {
  for (const assignment of assignments) {
    if (assignment.stationId !== stationId || assignment.slot !== slot) continue;
    const end = exclusiveTermEnd(assignment);
    if (end && end.getTime() > now.getTime()) return assignment;
  }
  return null;
}

/** A short date for messages, in Detroit time. */
export function formatTermEnd(end: Date): string {
  return end.toLocaleDateString('en-US', {
    timeZone: 'America/Detroit',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** A started checkout that reserves a slot until it expires. */
export type CheckoutHold = {
  stationId: string;
  slot: 1 | 2;
  sessionId: string;
  expiresAt: string;
};

/** A live checkout hold on this slot, if another buyer is mid-payment. */
export function activeCheckoutHold(
  holds: readonly CheckoutHold[],
  stationId: string,
  slot: 1 | 2,
  now: Date = new Date(),
): CheckoutHold | null {
  return (
    holds.find(
      (h) =>
        h.stationId === stationId &&
        h.slot === slot &&
        new Date(h.expiresAt).getTime() > now.getTime(),
    ) ?? null
  );
}

/** A paid purchase still awaiting admin review blocks a second sale of the slot. */
export function pendingPurchase<
  T extends { stationId: string; slot: 1 | 2; status: string; sessionId?: string },
>(leads: readonly T[], stationId: string, slot: 1 | 2): T | null {
  return (
    leads.find(
      (l) => l.stationId === stationId && l.slot === slot && l.status === 'pending' && l.sessionId,
    ) ?? null
  );
}
