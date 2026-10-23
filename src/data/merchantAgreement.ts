// The Station Anchor Merchant Agreement.
//
// Browser safe and pure: the partner page shows it before payment, the server
// requires the matching version to start a checkout, and the confirmation
// email repeats it, so the merchant always has a copy of what they agreed to.
// Bump the version whenever the wording changes.

export const MERCHANT_AGREEMENT_VERSION = '2026-10-23';

export const MERCHANT_AGREEMENT_TITLE = 'DPM - Go! Station Anchor Merchant Agreement';

export const MERCHANT_AGREEMENT_TERMS: readonly string[] = [
  'Placement. Motorcity Automated Systems ("MAS") will feature the merchant in the purchased slot of the selected station drawer in the DPM - Go! app once the placement is approved. Approval is normally completed within 24 hours of payment.',
  'Annual term and exclusivity. An annual placement runs for 12 months from approval. During that term the same slot at the same station will not be sold to another business.',
  'Monthly placements. A monthly placement renews each month until cancelled and is not exclusive beyond the current paid month.',
  'Fees. Fees are $1,875 per year for an annual placement and $375 per month for a monthly placement, charged through Stripe. Fees are set by MAS and are non-refundable once the placement goes live, except where MAS cannot provide the placement.',
  'Content. The merchant confirms that its name, logo, photos, links and rider perk are accurate and that it has the right to use them. MAS may edit or decline content that is misleading, unlawful or unsuitable.',
  'Rider perks. The merchant will honor any rider perk it publishes in the app for the period it is shown.',
  'No guarantees. MAS reports approximate engagement but does not guarantee riders, visits, sales or any business result. DPM - Go! is independent and is not affiliated with or endorsed by the Detroit Transportation Corporation or the QLINE.',
  'Service changes. Transit service, station access and app availability can change. If a station closes for an extended period, MAS may move the placement to a nearby station or credit the unused time.',
  'Cancellation. Either party may end the agreement with written notice to support@dpmgo.app. Monthly placements stop at the end of the paid month; annual placements are not prorated unless MAS ends the agreement without cause.',
  'Agreement. Checking the agreement box and completing payment constitutes acceptance of these terms.',
];
