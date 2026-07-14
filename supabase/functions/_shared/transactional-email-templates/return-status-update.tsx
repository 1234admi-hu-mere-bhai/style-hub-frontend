/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const SITE_URL = 'https://muffigoutapparelhub.com'
const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'

type EventType = 'return_approved' | 'return_rejected' | 'return_picked_up'

interface Props {
  customerName?: string
  orderNumber?: string
  eventType?: EventType
  refundAmount?: number
  refundEta?: string
  rejectionReason?: string
}

const COPY: Record<EventType, { badge: string; heading: string; emoji: string; accent: string; bg: string }> = {
  return_approved: {
    badge: 'Return Approved',
    heading: 'Great news — your return is approved',
    emoji: '✅',
    accent: '#0d9488',
    bg: '#e8f7f0',
  },
  return_rejected: {
    badge: 'Return Request Rejected',
    heading: 'We couldn\'t approve this return',
    emoji: '❌',
    accent: '#dc2626',
    bg: '#fdecec',
  },
  return_picked_up: {
    badge: 'Package Picked Up',
    heading: 'We\'ve picked up your package',
    emoji: '📦',
    accent: '#6e4ce6',
    bg: '#f4f1ff',
  },
}

const fmt = (n?: number) => (n === undefined || n === null ? '' : `₹${Number(n).toLocaleString('en-IN')}`)

const Email = ({
  customerName, orderNumber, eventType = 'return_approved',
  refundAmount, refundEta, rejectionReason,
}: Props) => {
  const c = COPY[eventType]
  const masked = orderNumber ? `••••${String(orderNumber).slice(-4)}` : ''
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{c.emoji} {c.badge} — order {masked}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Section style={{ ...heroBar, background: `linear-gradient(135deg, #1a1233 0%, #2d1f5f 55%, ${c.accent} 100%)` }}>
            <Img src={LOGO_URL} width="36" height="36" alt={SITE_NAME} style={logoImg} />
            <Text style={heroBrand}>MUFFIGOUT</Text>
            <Text style={heroBadge}>{c.emoji} {c.badge}</Text>
            {orderNumber && <Text style={heroOrderId}>Order <strong style={{ color: '#fff' }}>{orderNumber}</strong></Text>}
          </Section>

          <Section style={whiteCard}>
            <Heading as="h2" style={{ ...h1, color: c.accent }}>{c.heading}</Heading>
            <Text style={bodyText}>Hi <strong>{customerName || 'there'}</strong>,</Text>

            {eventType === 'return_approved' && (
              <>
                <Text style={bodyText}>
                  Your return request has been approved. We'll arrange a reverse pickup shortly — no action needed from your side.
                </Text>
                <Section style={{ ...highlight, backgroundColor: c.bg, borderLeft: `4px solid ${c.accent}` }}>
                  {refundAmount !== undefined && refundAmount > 0 && (
                    <Text style={highlightLine}>
                      <span style={highlightKey}>Refund amount</span>{' '}
                      <strong style={{ color: c.accent, fontSize: '16px' }}>{fmt(refundAmount)}</strong>
                    </Text>
                  )}
                  {refundEta && (
                    <Text style={highlightLine}>
                      <span style={highlightKey}>Expected by</span>{' '}
                      <strong>{refundEta}</strong>
                    </Text>
                  )}
                  <Text style={{ ...highlightLine, marginTop: '6px' }}>
                    You'll be able to choose your refund method (Wallet or original payment) from the Track Order page.
                  </Text>
                </Section>
              </>
            )}

            {eventType === 'return_rejected' && (
              <>
                <Text style={bodyText}>
                  Unfortunately your return request couldn't be approved.
                </Text>
                <Section style={{ ...highlight, backgroundColor: c.bg, borderLeft: `4px solid ${c.accent}` }}>
                  <Text style={highlightLine}>
                    <span style={highlightKey}>Reason</span>{' '}
                    <strong>{rejectionReason || 'Please contact support for details.'}</strong>
                  </Text>
                </Section>
                <Text style={bodyText}>
                  If you'd like to discuss this, our support team is happy to help.
                </Text>
              </>
            )}

            {eventType === 'return_picked_up' && (
              <>
                <Text style={bodyText}>
                  The courier has successfully picked up your package. Your refund is now being processed and should reflect in your chosen account within <strong>5–7 business days</strong>.
                </Text>
                <Section style={{ ...highlight, backgroundColor: c.bg, borderLeft: `4px solid ${c.accent}` }}>
                  {refundAmount !== undefined && refundAmount > 0 && (
                    <Text style={highlightLine}>
                      <span style={highlightKey}>Refund amount</span>{' '}
                      <strong style={{ color: c.accent, fontSize: '16px' }}>{fmt(refundAmount)}</strong>
                    </Text>
                  )}
                  <Text style={highlightLine}>
                    You'll receive a final confirmation once the refund is issued.
                  </Text>
                </Section>
              </>
            )}
          </Section>

          <Section style={{ padding: '4px 24px 24px', textAlign: 'center' as const }}>
            <Button
              href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
              style={{ ...primaryBtn, backgroundColor: c.accent }}
            >
              View order
            </Button>
          </Section>

          <Hr style={{ borderColor: '#eee', margin: '0 24px' }} />
          <Text style={footerText}>
            Questions? Reply to this email or visit{' '}
            <a href={`${SITE_URL}/contact`} style={{ color: c.accent, textDecoration: 'underline' }}>our support page</a>.
          </Text>
          <Text style={footerBrand}>{SITE_NAME} · muffigoutapparelhub.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const t = (data.eventType as EventType) || 'return_approved'
    const num = data.orderNumber ? `••••${String(data.orderNumber).slice(-4)}` : ''
    if (t === 'return_approved') return `Return approved for order ${num} — refund on the way`
    if (t === 'return_rejected') return `Update on your return request for order ${num}`
    return `Package picked up for order ${num} — refund processing`
  },
  displayName: 'Return status update (approved / rejected / picked up)',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'MGH51866093',
    eventType: 'return_approved',
    refundAmount: 1499,
    refundEta: 'Mon, 20 Jul 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", Arial, sans-serif', margin: 0, padding: 0 }
const outer = { maxWidth: '620px', margin: '0 auto' }
const heroBar = { padding: '22px 24px', borderRadius: '10px 10px 0 0' }
const logoImg = { display: 'inline-block' as const, verticalAlign: 'middle' as const, borderRadius: '8px', marginRight: '10px' }
const heroBrand = { display: 'inline-block' as const, verticalAlign: 'middle' as const, fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '20px', fontWeight: 700 as const, color: '#fff', letterSpacing: '2px', margin: 0 }
const heroBadge = { fontSize: '15px', fontWeight: 700 as const, color: '#fff', margin: '10px 0 0', fontFamily: '"Space Grotesk", Arial, sans-serif' }
const heroOrderId = { fontSize: '12px', color: '#cabfff', margin: '4px 0 0' }
const whiteCard = { padding: '26px 24px 4px' }
const h1 = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '20px', fontWeight: 700 as const, margin: '0 0 12px' }
const bodyText = { fontSize: '14px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 12px' }
const highlight = { padding: '16px 20px', margin: '10px 0 14px', borderRadius: '10px' }
const highlightLine = { fontSize: '13px', color: '#3a3a4a', margin: '4px 0', lineHeight: '1.5' }
const highlightKey = { color: '#6c6c7d', display: 'inline-block' as const, minWidth: '130px' }
const primaryBtn = { color: '#fff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '999px', padding: '14px 30px', textDecoration: 'none', display: 'inline-block' as const }
const footerText = { fontSize: '12px', color: '#888', textAlign: 'center' as const, padding: '10px 24px 4px', margin: 0 }
const footerBrand = { fontSize: '11px', color: '#aaa', textAlign: 'center' as const, padding: '4px 24px 24px', margin: 0 }
