/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const SITE_URL = 'https://muffigoutapparelhub.com'
const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'

type RequestKind = 'return' | 'exchange' | 'replacement'

interface Props {
  customerName?: string
  orderNumber?: string
  requestType?: RequestKind
  reason?: string
  exchangeSize?: string
  exchangeColor?: string
  itemName?: string
}

const COPY: Record<RequestKind, { badge: string; heading: string; intro: string; emoji: string; accent: string }> = {
  return: {
    badge: 'Return Request Received',
    heading: 'Your return is being reviewed',
    intro: "We've received your return request. Our team will review it within 24 hours and get back to you with the next steps.",
    emoji: '↩️',
    accent: '#6e4ce6',
  },
  exchange: {
    badge: 'Exchange Request Received',
    heading: 'Your exchange is being reviewed',
    intro: "We've received your exchange request. Our team will review it within 24 hours and confirm the swap.",
    emoji: '🔁',
    accent: '#0d9488',
  },
  replacement: {
    badge: 'Replacement Request Received',
    heading: 'Your replacement is being reviewed',
    intro: "We've received your replacement request. Our team will review it within 24 hours and get a fresh piece on its way.",
    emoji: '📦',
    accent: '#c9a84c',
  },
}

const Email = ({
  customerName, orderNumber, requestType = 'return',
  reason, exchangeSize, exchangeColor, itemName,
}: Props) => {
  const c = COPY[requestType]
  const masked = orderNumber ? `••••${String(orderNumber).slice(-4)}` : ''
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{c.emoji} {c.badge} for order {masked}</Preview>
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
            <Text style={bodyText}>{c.intro}</Text>
          </Section>

          <Section style={{ ...detailsCard, borderLeft: `4px solid ${c.accent}` }}>
            <Text style={detailsHeading}>Request Details</Text>
            {itemName && <Text style={detailLine}><span style={detailKey}>Item</span> <strong>{itemName}</strong></Text>}
            {requestType === 'exchange' && (exchangeSize || exchangeColor) && (
              <Text style={detailLine}>
                <span style={detailKey}>Requested change</span>{' '}
                <strong>
                  {exchangeSize ? `Size → ${exchangeSize}` : ''}
                  {exchangeSize && exchangeColor ? ' · ' : ''}
                  {exchangeColor ? `Color → ${exchangeColor}` : ''}
                </strong>
              </Text>
            )}
            {reason && (
              <Text style={detailLine}>
                <span style={detailKey}>Reason</span>{' '}
                <span style={{ color: '#1a1a2e' }}>{reason}</span>
              </Text>
            )}
          </Section>

          <Section style={{ padding: '20px 24px', textAlign: 'center' as const }}>
            <Button
              href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
              style={{ ...primaryBtn, backgroundColor: c.accent }}
            >
              Track this request
            </Button>
          </Section>

          <Hr style={{ borderColor: '#eee', margin: '0 24px' }} />
          <Text style={footerText}>
            Need help? Reply to this email or visit{' '}
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
    const t = (data.requestType as RequestKind) || 'return'
    const label = t === 'exchange' ? 'Exchange' : t === 'replacement' ? 'Replacement' : 'Return'
    const num = data.orderNumber ? `••••${String(data.orderNumber).slice(-4)}` : ''
    return `${label} request received for order ${num} — ${SITE_NAME}`
  },
  displayName: 'Return / Exchange / Replacement request received',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'MGH51866093',
    requestType: 'exchange',
    reason: "The size runs slightly small.",
    exchangeSize: 'XXL',
    itemName: 'MUFFIGOUT Straight Track Pants',
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
const detailsCard = { backgroundColor: '#f7f5ff', padding: '18px 22px', margin: '16px 24px', borderRadius: '10px' }
const detailsHeading = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '13px', fontWeight: 700 as const, color: '#1a1a2e', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const detailLine = { fontSize: '13px', color: '#3a3a4a', margin: '4px 0', lineHeight: '1.5' }
const detailKey = { color: '#6c6c7d', display: 'inline-block' as const, minWidth: '130px' }
const primaryBtn = { color: '#fff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '999px', padding: '14px 30px', textDecoration: 'none', display: 'inline-block' as const }
const footerText = { fontSize: '12px', color: '#888', textAlign: 'center' as const, padding: '10px 24px 4px', margin: 0 }
const footerBrand = { fontSize: '11px', color: '#aaa', textAlign: 'center' as const, padding: '4px 24px 24px', margin: 0 }
