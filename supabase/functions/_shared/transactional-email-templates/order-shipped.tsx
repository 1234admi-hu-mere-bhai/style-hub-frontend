/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const SITE_URL = 'https://muffigoutapparelhub.com'
const LOGO_URL =
  'https://www.muffigoutapparelhub.com/assets/logo-new.png'

interface OrderItem {
  name: string
  image?: string
  size?: string
  color?: string
  quantity?: number
}

interface OrderShippedProps {
  customerName?: string
  orderNumber?: string
  trackingAwb?: string
  courier?: string
  estimatedDelivery?: string
  items?: OrderItem[]
}

const OrderShippedEmail = ({
  customerName,
  orderNumber,
  trackingAwb,
  courier,
  estimatedDelivery,
  items,
}: OrderShippedProps) => {
  const firstItem = items && items[0]
  const moreCount = items && items.length > 1 ? items.length - 1 : 0

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your {SITE_NAME} order {orderNumber ? `••••${orderNumber.slice(-4)}` : ''} has shipped and is on its way 📦
      </Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* HERO */}
          <Section style={heroBar}>
            <Row>
              <Column style={{ verticalAlign: 'middle' }}>
                <Img src={LOGO_URL} width="36" height="36" alt={SITE_NAME} style={logoImg} />
                <Text style={heroBrand}>MUFFIGOUT</Text>
              </Column>
              <Column align="right" style={{ verticalAlign: 'middle' }}>
                <Text style={heroBadge}>Order Shipped</Text>
                {orderNumber && (
                  <Text style={heroOrderId}>
                    Order ID <span style={heroOrderIdBold}>{orderNumber}</span>
                  </Text>
                )}
              </Column>
            </Row>
          </Section>

          {/* HEADLINE */}
          <Section style={headlineCard}>
            {firstItem && (
              <Row>
                <Column>
                  <Text style={firstItemBrand}>{firstItem.name.split(' ').slice(0, 3).join(' ')}</Text>
                  <Text style={firstItemSub}>
                    {items!.length} item{items!.length === 1 ? '' : 's'} from MUFFIGOUT
                  </Text>
                </Column>
                {firstItem.image && (
                  <Column align="right" style={{ width: '80px' }}>
                    <Img
                      src={firstItem.image}
                      width="64"
                      height="64"
                      alt={firstItem.name}
                      style={heroItemImg}
                    />
                  </Column>
                )}
              </Row>
            )}

            <Heading as="h1" style={bigStatus}>
              On its way 🚚
            </Heading>
            {estimatedDelivery && (
              <Text style={bigDate}>Arriving by {estimatedDelivery}</Text>
            )}

            <Section style={metaRow}>
              <Row>
                <Column>
                  <Text style={metaLabel}># Order number</Text>
                  <Text style={metaValue}>{orderNumber || '—'}</Text>
                </Column>
                <Column>
                  <Text style={metaLabel}>📦 Tracking number</Text>
                  <Text style={metaValue}>{trackingAwb || '—'}</Text>
                </Column>
              </Row>
              {courier && (
                <Row style={{ marginTop: '8px' }}>
                  <Column>
                    <Text style={metaLabel}>🚚 Courier</Text>
                    <Text style={metaValue}>{courier}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* CTA buttons */}
            <Section style={btnRow}>
              <Row>
                <Column align="left">
                  <Button
                    href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
                    style={darkPillBtn}
                  >
                    View order
                  </Button>
                </Column>
                <Column align="left">
                  {trackingAwb && (
                    <Button
                      href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
                      style={lightPillBtn}
                    >
                      Track shipment
                    </Button>
                  )}
                </Column>
              </Row>
            </Section>
          </Section>

          {/* GREETING */}
          <Section style={whiteCard}>
            <Text style={greeting}>
              Hi <strong>{customerName || 'there'}</strong>,
            </Text>
            <Text style={bodyText}>
              Great news — your MUFFIGOUT order has been packed and handed over to{' '}
              {courier || 'our courier partner'}. You'll receive it{' '}
              {estimatedDelivery ? <>by <strong>{estimatedDelivery}</strong></> : 'soon'}.
            </Text>
          </Section>

          {/* ITEMS */}
          {items && items.length > 0 && (
            <Section style={itemsCard}>
              <Heading as="h3" style={itemsHeading}>
                What's in this shipment
              </Heading>
              {items.map((it, idx) => (
                <Section key={idx} style={idx === items.length - 1 ? itemRowLast : itemRow}>
                  <Row>
                    <Column style={itemImgCol}>
                      {it.image ? (
                        <Img src={it.image} width="56" height="56" alt={it.name} style={itemImg} />
                      ) : (
                        <div style={itemImgPlaceholder} />
                      )}
                    </Column>
                    <Column style={itemInfoCol}>
                      <Text style={itemName}>{it.name}</Text>
                      {(it.size || it.color || it.quantity) && (
                        <Text style={itemMeta}>
                          {it.size ? `Size ${it.size}` : ''}
                          {it.size && it.color ? ' · ' : ''}
                          {it.color || ''}
                          {it.quantity ? ` · Qty ${it.quantity}` : ''}
                        </Text>
                      )}
                      <Text style={statusPill}>Out for delivery</Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          {/* FOOTER */}
          <Hr style={footerHr} />
          <Text style={footerText}>
            Need help with your shipment? Reply to this email or visit{' '}
            <a href={`${SITE_URL}/contact`} style={footerLink}>
              support
            </a>
            .
          </Text>
          <Text style={footerBrand}>
            {SITE_NAME} · Crafted with Trust, Worn with Pride
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderShippedEmail,
  subject: (data: Record<string, any>) => {
    const item = (data.items && data.items[0]?.name) || 'Your order'
    const more = data.items && data.items.length > 1 ? ` +(${data.items.length - 1})` : ''
    return `Your ${item}${more} is on its way!`
  },
  displayName: 'Order shipped notification',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'MGH51866093',
    trackingAwb: 'SF1709888598AJI',
    courier: 'Delhivery',
    estimatedDelivery: 'Sat, 31 May',
    items: [
      {
        name: 'MUFFIGOUT Relaxed Fit Jeans',
        image: 'https://www.muffigoutapparelhub.com/assets/logo-new.png',
        size: '46',
        quantity: 1,
      },
      {
        name: 'MUFFIGOUT Straight Track Pants with Cargo Pockets',
        image: 'https://www.muffigoutapparelhub.com/assets/logo-new.png',
        size: '3XL',
        quantity: 1,
      },
    ],
  },
} satisfies TemplateEntry

// ─── STYLES ─────────────────────────────────────────────────
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
}
const outer = { maxWidth: '620px', margin: '0 auto', padding: '0' }

const heroBar = {
  background: 'linear-gradient(135deg, #1a1233 0%, #2d1f5f 50%, #6e4ce6 100%)',
  padding: '20px 24px',
  borderRadius: '10px 10px 0 0',
}
const logoImg = {
  display: 'inline-block',
  verticalAlign: 'middle',
  borderRadius: '8px',
  marginRight: '10px',
}
const heroBrand = {
  display: 'inline-block',
  verticalAlign: 'middle',
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '20px',
  fontWeight: 700 as const,
  color: '#ffffff',
  letterSpacing: '2px',
  margin: '0',
}
const heroBadge = {
  fontSize: '15px',
  fontWeight: 700 as const,
  color: '#ffffff',
  margin: '0',
  fontFamily: '"Space Grotesk", Arial, sans-serif',
}
const heroOrderId = { fontSize: '11px', color: '#cabfff', margin: '4px 0 0' }
const heroOrderIdBold = { color: '#ffffff', fontWeight: 700 as const, textDecoration: 'underline' }

const headlineCard = { backgroundColor: '#ffffff', padding: '28px 24px 20px', borderBottom: '1px solid #eceef2' }
const firstItemBrand = {
  fontSize: '15px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '0',
  fontFamily: '"Space Grotesk", Arial, sans-serif',
}
const firstItemSub = { fontSize: '12px', color: '#8a8a99', margin: '2px 0 0' }
const heroItemImg = { borderRadius: '12px', border: '1px solid #e2dafc' }
const bigStatus = {
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '32px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '24px 0 4px',
  letterSpacing: '-0.02em',
  lineHeight: '1.1',
}
const bigDate = {
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '24px',
  fontWeight: 600 as const,
  color: '#6e4ce6',
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
}
const metaRow = { padding: '12px 0' }
const metaLabel = { fontSize: '11px', color: '#8a8a99', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600 as const }
const metaValue = { fontSize: '13px', color: '#1a1a2e', margin: '0', fontWeight: 600 as const, fontFamily: 'monospace' }
const btnRow = { padding: '20px 0 4px' }
const darkPillBtn = {
  backgroundColor: '#1a1a2e',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600 as const,
  borderRadius: '999px',
  padding: '11px 22px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  marginRight: '8px',
}
const lightPillBtn = {
  backgroundColor: '#f4f1ff',
  color: '#6e4ce6',
  fontSize: '13px',
  fontWeight: 600 as const,
  borderRadius: '999px',
  padding: '11px 22px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  border: '1px solid #d8cdfa',
}

const whiteCard = { padding: '20px 24px', backgroundColor: '#ffffff' }
const greeting = { fontSize: '16px', color: '#1a1a2e', margin: '0 0 12px' }
const bodyText = { fontSize: '14px', color: '#3a3a4a', lineHeight: '1.6', margin: '0' }

const itemsCard = { backgroundColor: '#fafafe', padding: '20px 24px', borderTop: '1px solid #eceef2' }
const itemsHeading = {
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '15px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '0 0 14px',
}
const itemRow = { padding: '10px 0', borderBottom: '1px solid #eceef2' }
const itemRowLast = { padding: '10px 0' }
const itemImgCol = { width: '66px', verticalAlign: 'top' as const }
const itemImg = { borderRadius: '8px', objectFit: 'cover' as const, border: '1px solid #e2dafc' }
const itemImgPlaceholder = { width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#e2dafc' }
const itemInfoCol = { verticalAlign: 'top' as const, paddingLeft: '4px' }
const itemName = { fontSize: '13px', fontWeight: 600 as const, color: '#1a1a2e', margin: '0 0 2px', lineHeight: '1.35' }
const itemMeta = { fontSize: '12px', color: '#6c6c7d', margin: '0 0 4px' }
const statusPill = {
  display: 'inline-block' as const,
  fontSize: '11px',
  fontWeight: 600 as const,
  color: '#6e4ce6',
  backgroundColor: '#f4f1ff',
  padding: '3px 10px',
  borderRadius: '999px',
  margin: '0',
}

const footerHr = { borderColor: '#eceef2', margin: '8px 24px' }
const footerText = { fontSize: '12px', color: '#8a8a99', textAlign: 'center' as const, margin: '12px 24px 4px', lineHeight: '1.5' }
const footerLink = { color: '#6e4ce6', textDecoration: 'underline' }
const footerBrand = { fontSize: '11px', color: '#a0a0b0', textAlign: 'center' as const, margin: '0 24px 24px', letterSpacing: '0.02em' }
