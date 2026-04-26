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

interface ContactSupportNotificationProps {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  subject?: string
  message?: string
  submittedAt?: string
}

const ContactSupportNotificationEmail = ({
  customerName = 'A customer',
  customerEmail = '—',
  customerPhone,
  subject = 'New support query',
  message = '',
  submittedAt,
}: ContactSupportNotificationProps) => {
  const when = submittedAt
    ? new Date(submittedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`New support query from ${customerName}: ${subject}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBand}>
            <Text style={headerLabel}>SUPPORT INBOX</Text>
            <Heading style={h1}>New customer query</Heading>
            <Text style={subline}>
              Reply directly to this email — it will go to the customer.
            </Text>
          </Section>

          <Section style={card}>
            <Text style={fieldLabel}>From</Text>
            <Text style={fieldValue}>{customerName}</Text>

            <Hr style={hr} />

            <Text style={fieldLabel}>Email</Text>
            <Text style={fieldValueMono}>{customerEmail}</Text>

            {customerPhone ? (
              <>
                <Hr style={hr} />
                <Text style={fieldLabel}>Phone</Text>
                <Text style={fieldValueMono}>{customerPhone}</Text>
              </>
            ) : null}

            <Hr style={hr} />

            <Text style={fieldLabel}>Subject</Text>
            <Text style={fieldValue}>{subject}</Text>

            <Hr style={hr} />

            <Text style={fieldLabel}>Message</Text>
            <Text style={messageBox}>{message}</Text>

            {when ? (
              <>
                <Hr style={hr} />
                <Text style={fieldLabel}>Submitted</Text>
                <Text style={fieldValueMuted}>{when} IST</Text>
              </>
            ) : null}
          </Section>

          <Text style={footer}>
            This message was submitted via the {SITE_NAME} contact form.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContactSupportNotificationEmail,
  subject: (data: Record<string, any>) =>
    `[Support] ${data?.subject || 'New customer query'} — ${data?.customerName || 'Unknown'}`,
  displayName: 'Contact form — internal notification',
  to: 'supportmuffigoutapparelhub@gmail.com',
  previewData: {
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav@example.com',
    customerPhone: '+91 98765 43210',
    subject: 'Question about size XL availability',
    message:
      'Hi team, I wanted to know if the relaxed-fit T-shirt in olive will be back in stock in size XL anytime soon? Thanks!',
    submittedAt: new Date().toISOString(),
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
  padding: '28px 24px',
  borderRadius: '16px 16px 0 0',
}
const headerLabel = {
  color: '#E0E7FF',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  margin: '0 0 6px',
}
const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 8px',
  lineHeight: 1.2,
}
const subline = { color: '#E0E7FF', fontSize: '13px', margin: '0' }
const card = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderTop: 'none',
  borderRadius: '0 0 16px 16px',
  padding: '24px',
}
const fieldLabel = {
  color: '#6B7280',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}
const fieldValue = { color: '#111827', fontSize: '15px', margin: '0', fontWeight: 500 }
const fieldValueMono = {
  color: '#111827',
  fontSize: '14px',
  margin: '0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const fieldValueMuted = { color: '#6B7280', fontSize: '13px', margin: '0' }
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
const footer = {
  color: '#9CA3AF',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '20px 0 0',
}
