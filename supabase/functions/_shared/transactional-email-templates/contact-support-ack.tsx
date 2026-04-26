/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const SUPPORT_PHONE = '+91 91363 54192'
const SUPPORT_HOURS = 'Mon – Sat, 9:30 AM – 7:30 PM IST'

interface ContactSupportAckProps {
  customerName?: string
  subject?: string
  message?: string
}

const ContactSupportAckEmail = ({
  customerName,
  subject,
  message,
}: ContactSupportAckProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — the {SITE_NAME} team will reply soon.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerBand}>
          <Text style={headerLabel}>WE GOT YOUR MESSAGE</Text>
          <Heading style={h1}>
            {customerName ? `Thanks, ${customerName}!` : 'Thanks for reaching out!'}
          </Heading>
          <Text style={subline}>
            Our support team will get back to you within 24 hours (usually much sooner).
          </Text>
        </Section>

        <Section style={card}>
          <Text style={paragraph}>
            We've received your query and one of our team members is on it. Here's a
            copy of what you sent us so you have it for your records:
          </Text>

          {subject ? (
            <>
              <Text style={fieldLabel}>SUBJECT</Text>
              <Text style={fieldValue}>{subject}</Text>
              <Hr style={hr} />
            </>
          ) : null}

          {message ? (
            <>
              <Text style={fieldLabel}>YOUR MESSAGE</Text>
              <Text style={messageBox}>{message}</Text>
            </>
          ) : null}
        </Section>

        <Section style={helpCard}>
          <Text style={helpTitle}>Need to reach us faster?</Text>
          <Text style={helpLine}>
            📞 <strong>{SUPPORT_PHONE}</strong>
          </Text>
          <Text style={helpLineMuted}>{SUPPORT_HOURS}</Text>
          <Text style={helpLine}>
            💬 WhatsApp:{' '}
            <a href="https://wa.me/919136354192" style={link}>
              wa.me/919136354192
            </a>
          </Text>
        </Section>

        <Text style={signoff}>
          — The {SITE_NAME} team
          <br />
          <span style={tagline}>Crafted with Trust, Worn with Pride</span>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactSupportAckEmail,
  subject: 'We got your message — MUFFIGOUT APPAREL HUB Support',
  displayName: 'Contact form — customer acknowledgment',
  previewData: {
    customerName: 'Aarav',
    subject: 'Question about size XL availability',
    message:
      'Hi team, I wanted to know if the relaxed-fit T-shirt in olive will be back in stock in size XL anytime soon? Thanks!',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = { padding: '24px 20px', maxWidth: '600px', margin: '0 auto' }
const headerBand = {
  background: 'linear-gradient(135deg, #6E56F8 0%, #14B8A6 100%)',
  padding: '32px 24px',
  borderRadius: '16px 16px 0 0',
  textAlign: 'center' as const,
}
const headerLabel = {
  color: '#E0E7FF',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  margin: '0 0 8px',
}
const h1 = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: 700,
  margin: '0 0 10px',
  lineHeight: 1.2,
}
const subline = { color: '#E0E7FF', fontSize: '14px', margin: '0', lineHeight: 1.5 }
const card = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderTop: 'none',
  borderRadius: '0 0 16px 16px',
  padding: '24px',
}
const paragraph = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: 1.6,
  margin: '0 0 18px',
}
const fieldLabel = {
  color: '#6B7280',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1px',
  margin: '0 0 4px',
}
const fieldValue = {
  color: '#111827',
  fontSize: '15px',
  margin: '0',
  fontWeight: 500,
}
const messageBox = {
  color: '#111827',
  fontSize: '14px',
  lineHeight: 1.6,
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#ffffff',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '14px',
}
const hr = { borderColor: '#E5E7EB', margin: '16px 0' }
const helpCard = {
  backgroundColor: '#F0FDFA',
  border: '1px solid #99F6E4',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0 0',
}
const helpTitle = {
  color: '#0F766E',
  fontSize: '14px',
  fontWeight: 700,
  margin: '0 0 10px',
}
const helpLine = { color: '#134E4A', fontSize: '14px', margin: '6px 0' }
const helpLineMuted = { color: '#5B6F6E', fontSize: '12px', margin: '0 0 8px' }
const link = { color: '#0F766E', textDecoration: 'underline' }
const signoff = {
  color: '#6B7280',
  fontSize: '13px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
  lineHeight: 1.6,
}
const tagline = {
  fontStyle: 'italic',
  color: '#9CA3AF',
  fontSize: '12px',
}
