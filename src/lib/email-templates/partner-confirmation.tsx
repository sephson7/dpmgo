import * as React from 'react';
import {
  Body,
  Container,
  Heading,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { TemplateEntry } from './registry';

export interface PartnerConfirmationProps {
  businessName?: string;
  stationName?: string;
  slot?: 1 | 2;
  plan?: 'monthly' | 'annual';
  receipt?: string;
  sessionId?: string;
}

const PartnerConfirmation = ({
  businessName,
  stationName,
  slot,
  plan,
  receipt,
  sessionId,
}: PartnerConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your DPM - Go! Station Anchor Slot payment is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>DPM - Go!</Text>
        <Heading style={h1}>Welcome to the DPM - Go! Partnership Program!</Heading>
        <Text style={text}>
          {businessName ? `Thank you, ${businessName}.` : 'Thank you.'} Your payment is confirmed.
        </Text>
        <Text style={text}>
          Please allow our team up to 24 hours to review and approve your Station Anchor Slot!
        </Text>
        <Section style={card}>
          <Text style={row}>Station: {stationName ?? 'To be confirmed'}</Text>
          <Text style={row}>
            {slot === 1
              ? 'Slot 1 — Annual anchor'
              : slot === 2
                ? 'Slot 2 — Rotating anchor'
                : 'Anchor slot'}
          </Text>
          <Text style={row}>
            {plan === 'annual'
              ? 'Annual partnership ($1,875 / year)'
              : plan === 'monthly'
                ? 'Monthly partnership ($375 / month)'
                : ''}
          </Text>
          {receipt && <Text style={row}>Reference: {receipt}</Text>}
          {sessionId && <Text style={small}>Payment ID: {sessionId}</Text>}
        </Section>
        <Hr style={hr} />
        <Text style={small}>
          Questions? Reply to this email or write to support@dpmgo.app.
          {'\n'}Motorcity Automated Systems · DPM - Go!
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: PartnerConfirmation,
  subject: 'Welcome to the DPM - Go! Partnership Program!',
  displayName: 'Partner payment confirmation',
  previewData: {
    businessName: 'Lafayette Coney Island',
    stationName: 'Times Square',
    slot: 1,
    plan: 'annual',
    receipt: 'DPM-ABC123',
    sessionId: 'cs_test_123',
  },
} satisfies TemplateEntry;

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' };
const container = { padding: '24px 28px', maxWidth: '560px' };
const brand = {
  color: '#0891b2',
  fontWeight: 700,
  letterSpacing: '2px',
  fontSize: '13px',
  margin: '0 0 8px',
};
const h1 = { color: '#070B14', fontSize: '22px', margin: '0 0 16px' };
const text = { color: '#1f2937', fontSize: '15px', lineHeight: '22px', margin: '0 0 12px' };
const card = {
  border: '1px solid #00b8c4',
  borderRadius: '10px',
  padding: '12px 16px',
  margin: '16px 0',
};
const row = { color: '#070B14', fontSize: '14px', margin: '4px 0' };
const small = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 0',
  whiteSpace: 'pre-line' as const,
};
const hr = { borderColor: '#e5e7eb', margin: '20px 0' };
