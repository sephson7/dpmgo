import { describe, expect, it } from 'vitest';
import {
  PARTNER_EMAIL_HEADLINE,
  PARTNER_EMAIL_PROMISE,
  PARTNER_EMAIL_SUBJECT,
  partnerConfirmationHtml,
  partnerConfirmationText,
  partnerLogoUrl,
} from '@/lib/email';

const details = {
  to: 'sam@lafayette.example',
  businessName: 'Lafayette Coney Island',
  stationName: 'Fort / Cass Station',
  slot: 1 as const,
  plan: 'annual' as const,
  receipt: 'DPM-4T9K2Z',
  sessionId: 'cs_test_123',
  origin: 'https://dpmgo.lovable.app',
};

describe('the partner confirmation email', () => {
  it('says exactly what the program promises', () => {
    const html = partnerConfirmationHtml(details, 'https://dpmgo.lovable.app/icon-512.png');
    expect(PARTNER_EMAIL_HEADLINE).toBe('Welcome to the DPM - Go! Partnership Program!');
    expect(PARTNER_EMAIL_PROMISE).toBe(
      'Please allow our team up to 24 hours to review and approve your Station Anchor Slot!',
    );
    expect(html).toContain(PARTNER_EMAIL_HEADLINE);
    expect(html).toContain(PARTNER_EMAIL_PROMISE);
  });

  it('greets the merchant by the name they gave', () => {
    const html = partnerConfirmationHtml(details, 'https://dpmgo.lovable.app/icon-512.png');
    expect(html).toContain('Lafayette Coney Island');
  });

  it('is branded with the DPM - Go! logo', () => {
    const html = partnerConfirmationHtml(details, 'https://dpmgo.lovable.app/icon-512.png');
    expect(html).toContain('https://dpmgo.lovable.app/icon-512.png');
    expect(html).toContain('alt="DPM - Go!"');
    expect(html).toContain('Motorcity Automated Systems');
  });

  it('carries the purchase the merchant made', () => {
    const html = partnerConfirmationHtml(details, 'https://dpmgo.lovable.app/icon-512.png');
    expect(html).toContain('Fort / Cass Station');
    expect(html).toContain('DPM-4T9K2Z');
    expect(html).toContain('cs_test_123');
  });

  it('escapes what the merchant typed', () => {
    const html = partnerConfirmationHtml(
      { ...details, businessName: '<script>alert(1)</script>' },
      'https://dpmgo.lovable.app/icon-512.png',
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('has a plain text version with the same facts', () => {
    const text = partnerConfirmationText(details);
    expect(text).toContain(PARTNER_EMAIL_HEADLINE);
    expect(text).toContain(PARTNER_EMAIL_PROMISE);
    expect(text).toContain('Fort / Cass Station');
    expect(text).toContain('DPM-4T9K2Z');
    expect(text).toContain('https://dpmgo.lovable.app');
  });

  it('uses the configured subject', () => {
    expect(PARTNER_EMAIL_SUBJECT).toBe('Welcome to the DPM - Go! Partnership Program!');
  });
});

describe('the logo in the email', () => {
  it('points at the deployment', () => {
    expect(partnerLogoUrl('https://dpmgo.lovable.app')).toBe(
      'https://dpmgo.lovable.app/icon-512.png',
    );
  });

  it('uses an absolute configured url as it is', () => {
    expect(partnerLogoUrl('https://dpmgo.lovable.app', 'https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png',
    );
  });

  it('resolves a configured path against the deployment', () => {
    expect(partnerLogoUrl('https://dpmgo.lovable.app', '/brand/logo.png')).toBe(
      'https://dpmgo.lovable.app/brand/logo.png',
    );
  });
});
