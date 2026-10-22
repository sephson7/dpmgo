// The partner confirmation email.
//
// The merchant buys an anchor slot from a flyer, so the confirmation has to
// arrive on its own: nobody is waiting on a reply to send it. The transport
// is pluggable because the deployment target changes (a Cloudflare Worker, a
// Node host, a laptop), and because the operator may have any one of three
// accounts. They are tried in order and the first one that is configured and
// accepts the message wins:
//
//   1. A Cloudflare Workers email binding (SEND_EMAIL). Free, native to the
//      platform, needs Email Routing and a verified destination.
//   2. Resend (RESEND_API_KEY). A plain HTTPS call, no dependency, needs a
//      verified sending domain.
//   3. A generic webhook (PARTNER_EMAIL_WEBHOOK_URL). The payload is posted
//      to an automation of the operator's choice.
//
// When none of them is configured the lead is still recorded and the caller
// is told the message was not delivered, so nothing is silently lost.

import { readServerSecret } from '@/lib/serverEnv';

export type AnchorPlan = 'monthly' | 'annual';

export type PartnerEmailDetails = {
  /** Where the confirmation goes. */
  to: string;
  /** The restaurant or business that bought the slot. */
  businessName: string;
  /** The station the slot belongs to. */
  stationName: string;
  slot: 1 | 2;
  plan: AnchorPlan;
  /** The receipt code the merchant can quote. */
  receipt: string;
  /** The Stripe session, so the merchant can quote the payment reference too. */
  sessionId: string;
  /** The public address of the deployment, used for the logo and the link. */
  origin: string;
};

export type EmailResult = {
  sent: boolean;
  /** Which transport delivered the message. */
  transport: string | null;
  error?: string;
};

const DEFAULT_FROM = 'DPM - Go! Partnership <partnerships@dpmgo.lovable.app>';
const DEFAULT_LOGO = '/icon-512.png';

/** The Cloudflare email binding, when the runtime provides one. */
type EmailBinding = {
  send: (message: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<unknown>;
};

function emailBinding(context: unknown): EmailBinding | null {
  const env = (context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)
    ?.cloudflare?.env;
  const binding = env?.['SEND_EMAIL'];
  if (!binding || typeof binding !== 'object') return null;
  const candidate = binding as Partial<EmailBinding>;
  if (typeof candidate.send !== 'function') return null;
  return candidate as EmailBinding;
}

/** The subject line of the partner confirmation. */
export const PARTNER_EMAIL_SUBJECT = 'Welcome to the DPM - Go! Partnership Program!';

/**
 * The headline and the sentence the merchant is promised. This wording is the
 * promise the program makes, so it lives in one place and is used by both the
 * HTML and the plain text version.
 */
export const PARTNER_EMAIL_HEADLINE = 'Welcome to the DPM - Go! Partnership Program!';
export const PARTNER_EMAIL_PROMISE =
  'Please allow our team up to 24 hours to review and approve your Station Anchor Slot!';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function planLabel(plan: AnchorPlan): string {
  return plan === 'annual'
    ? 'Annual partnership ($1,875 / year)'
    : 'Monthly partnership ($375 / month)';
}

function slotLabel(slot: 1 | 2): string {
  return slot === 1 ? 'Slot 1 — Annual anchor' : 'Slot 2 — Rotating anchor';
}

/** The branded HTML body of the confirmation. */
export function partnerConfirmationHtml(details: PartnerEmailDetails, logoUrl: string): string {
  const origin = details.origin.replace(/\/+$/, '');
  const rows: [string, string][] = [
    ['Station', details.stationName],
    ['Slot', slotLabel(details.slot)],
    ['Plan', planLabel(details.plan)],
    ['Receipt', details.receipt],
    ['Payment reference', details.sessionId],
  ];
  const rowHtml = rows
    .map(
      ([label, value]) => `
            <tr>
              <td style="padding:8px 16px 8px 0;color:#7c8ea3;font:500 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:8px 0;color:#e6edf5;font:600 13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;vertical-align:top;">${escapeHtml(value)}</td>
            </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(PARTNER_EMAIL_SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background:#070b14;-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070b14;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1424;border:1px solid #1b2b3f;border-radius:16px;padding:28px 24px;">
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <img src="${escapeHtml(logoUrl)}" width="88" height="88" alt="DPM - Go!" style="display:block;width:88px;height:88px;border:0;border-radius:16px;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:6px;">
                <p style="margin:0;color:#00f0ff;font:700 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;text-transform:uppercase;">Motorcity Automated Systems</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h1 style="margin:0;color:#ffffff;font:700 22px/1.25 'Space Grotesk',Segoe UI,Helvetica,Arial,sans-serif;">${escapeHtml(PARTNER_EMAIL_HEADLINE)}</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:6px;">
                <p style="margin:0;color:#00f0ff;font:600 13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(details.businessName)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:22px;">
                <p style="margin:0;color:#b9c7d6;font:400 14px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">${escapeHtml(PARTNER_EMAIL_PROMISE)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1120;border:1px solid #1b2b3f;border-radius:12px;padding:6px 14px;">
                  ${rowHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:22px;">
                <p style="margin:0;color:#8fa3b8;font:400 13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">We are preparing your custom 3D map pin and your rider perk banner. Keep your receipt code handy if you need to reach us.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:6px;">
                <a href="${escapeHtml(origin)}" style="display:inline-block;background:#00f0ff;color:#070b14;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;padding:14px 22px;border-radius:10px;">Open the DPM - Go! map</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:22px;border-top:1px solid #1b2b3f;">
                <p style="margin:0;color:#5d6f84;font:500 10px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;">Motorcity Automated Systems</p>
                <p style="margin:4px 0 0;color:#5d6f84;font:400 11px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">Building Targeted Autonomous Civic-Tech Solutions</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** The plain text version, for clients that do not render HTML. */
export function partnerConfirmationText(details: PartnerEmailDetails): string {
  const origin = details.origin.replace(/\/+$/, '');
  return [
    PARTNER_EMAIL_HEADLINE,
    '',
    details.businessName,
    '',
    PARTNER_EMAIL_PROMISE,
    '',
    `Station: ${details.stationName}`,
    `Slot: ${slotLabel(details.slot)}`,
    `Plan: ${planLabel(details.plan)}`,
    `Receipt: ${details.receipt}`,
    `Payment reference: ${details.sessionId}`,
    '',
    `Open the DPM - Go! map: ${origin}`,
    '',
    'Motorcity Automated Systems',
    'Building Targeted Autonomous Civic-Tech Solutions',
  ].join('\n');
}

/** The absolute URL of the logo the email shows. */
export function partnerLogoUrl(origin: string, configured?: string): string {
  const base = origin.replace(/\/+$/, '');
  if (configured) {
    return configured.startsWith('http')
      ? configured
      : `${base}${configured.startsWith('/') ? '' : '/'}${configured}`;
  }
  return `${base}${DEFAULT_LOGO}`;
}

/**
 * Sends the partner confirmation through the first transport that is
 * configured. It never throws: a delivery failure is reported to the caller
 * so the lead can be retried later.
 */
export async function sendPartnerConfirmationEmail(
  details: PartnerEmailDetails,
  context?: unknown,
): Promise<EmailResult> {
  const from = (await readServerSecret('PARTNER_EMAIL_FROM', context)) ?? DEFAULT_FROM;
  const logoUrl = partnerLogoUrl(
    details.origin,
    await readServerSecret('PARTNER_EMAIL_LOGO_URL', context),
  );
  const subject = PARTNER_EMAIL_SUBJECT;
  const html = partnerConfirmationHtml(details, logoUrl);
  const text = partnerConfirmationText(details);

  // 1. The Cloudflare email binding.
  const binding = emailBinding(context);
  if (binding) {
    try {
      await binding.send({ from, to: details.to, subject, html, text });
      return { sent: true, transport: 'cloudflare-email-binding' };
    } catch (error) {
      console.error('Cloudflare email binding failed', error);
    }
  }

  // 2. Resend.
  const resendKey = await readServerSecret('RESEND_API_KEY', context);
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [details.to], subject, html, text }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Resend returned ${response.status}: ${detail.slice(0, 200)}`);
      }
      return { sent: true, transport: 'resend' };
    } catch (error) {
      console.error('Resend delivery failed', error);
    }
  }

  // 3. The operator's own webhook.
  const webhook = await readServerSecret('PARTNER_EMAIL_WEBHOOK_URL', context);
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner.confirmation',
          ...details,
          from,
          subject,
          html,
          text,
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Email webhook returned ${response.status}: ${detail.slice(0, 200)}`);
      }
      return { sent: true, transport: 'webhook' };
    } catch (error) {
      console.error('Partner email webhook failed', error);
    }
  }

  return {
    sent: false,
    transport: null,
    error:
      'No email transport is configured. Set RESEND_API_KEY, a Cloudflare SEND_EMAIL binding or PARTNER_EMAIL_WEBHOOK_URL.',
  };
}
