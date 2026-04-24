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
  'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/muffigout-logo.png'

interface OrderItem {
  name: string
  image?: string
  size?: string
  color?: string
  quantity?: number
  price?: number
  originalPrice?: number
}

interface OrderPlacedProps {
  customerName?: string
  orderNumber?: string
  orderTotal?: number
  subtotal?: number
  shippingCost?: number
  paymentMethod?: string
  itemCount?: number
  items?: OrderItem[]
  orderDate?: string
  estimatedDelivery?: string
  shippingAddress?: {
    full_name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
}

const fmt = (n?: number) =>
  n === undefined || n === null
    ? ''
    : `₹${Number(n).toLocaleString('en-IN')}`

const OrderPlacedEmail = ({
  customerName,
  orderNumber,
  orderTotal,
  subtotal,
  shippingCost,
  paymentMethod,
  itemCount,
  items,
  orderDate,
  estimatedDelivery,
  shippingAddress,
}: OrderPlacedProps) => {
  const totalSavings = (items || []).reduce((acc, it) => {
    if (it.originalPrice && it.price && it.originalPrice > it.price) {
      return acc + (it.originalPrice - it.price) * (it.quantity || 1)
    }
    return acc
  }, 0)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Order confirmed! Your {SITE_NAME} order {orderNumber ? `••••${orderNumber.slice(-4)}` : ''} is on its way.
      </Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* HERO HEADER — purple bar with logo + label */}
          <Section style={heroBar}>
            <Row>
              <Column style={{ verticalAlign: 'middle' }}>
                <Img src={LOGO_URL} width="36" height="36" alt={SITE_NAME} style={logoImg} />
                <Text style={heroBrand}>MUFFIGOUT</Text>
              </Column>
              <Column align="right" style={{ verticalAlign: 'middle' }}>
                <Text style={heroBadge}>Order Confirmation</Text>
                {orderNumber && (
                  <Text style={heroOrderId}>
                    Order ID <span style={heroOrderIdBold}>{orderNumber}</span>
                  </Text>
                )}
              </Column>
            </Row>
          </Section>

          {/* TRUST STRIP */}
          <Section style={trustStrip}>
            <Text style={trustText}>
              Crafted with Trust, Worn with Pride. Your order is being prepared with
              care and quality checks.
            </Text>
          </Section>

          {/* GREETING */}
          <Section style={whiteCard}>
            <Text style={greeting}>
              Hi <strong>{customerName || 'there'}</strong>,
            </Text>
            <Text style={bodyText}>
              Your MUFFIGOUT order has been placed successfully.
            </Text>
            <Text style={bodyText}>
              Thank you for shopping with us! We hope to deliver this order
              {estimatedDelivery ? (
                <>
                  {' '}by <strong>{estimatedDelivery}</strong>.
                </>
              ) : (
                ' as soon as possible.'
              )}{' '}
              Once packed and shipped, we'll send tracking details right away.
            </Text>
            <Text style={bodyText}>Meanwhile, stay bold, stay stylish! ✨</Text>
          </Section>

          {/* ORDER DETAILS BANNER */}
          <Section style={detailsBanner}>
            <Heading as="h3" style={detailsHeading}>
              Your Order Details
            </Heading>
            <Row>
              <Column>
                {orderNumber && (
                  <Text style={detailLine}>
                    <span style={detailKey}>Order ID</span>{' '}
                    <span style={detailValue}>{orderNumber}</span>
                  </Text>
                )}
                {orderDate && (
                  <Text style={detailLine}>
                    <span style={detailKey}>Order placed on</span>{' '}
                    <span style={detailValue}>{orderDate}</span>
                  </Text>
                )}
                {shippingAddress?.full_name && (
                  <Text style={detailLine}>
                    <span style={detailKey}>Delivering to</span>{' '}
                    <span style={detailValue}>
                      {shippingAddress.full_name}
                      {shippingAddress.pincode ? `, ${shippingAddress.pincode}` : ''}
                    </span>
                  </Text>
                )}
              </Column>
              <Column align="right" style={{ verticalAlign: 'middle' }}>
                <Button
                  href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
                  style={darkPillBtn}
                >
                  View Order
                </Button>
              </Column>
            </Row>
          </Section>

          {/* ITEMS */}
          {items && items.length > 0 && (
            <Section style={itemsCard}>
              <Heading as="h3" style={itemsHeading}>
                Items you have purchased
              </Heading>

              {items.map((it, idx) => (
                <Section key={idx} style={idx === items.length - 1 ? itemRowLast : itemRow}>
                  <Row>
                    <Column style={itemImgCol}>
                      {it.image ? (
                        <Img src={it.image} width="68" height="68" alt={it.name} style={itemImg} />
                      ) : (
                        <div style={itemImgPlaceholder} />
                      )}
                    </Column>
                    <Column style={itemInfoCol}>
                      <Text style={itemName}>{it.name}</Text>
                      {(it.size || it.color) && (
                        <Text style={itemMeta}>
                          {it.size ? `Size ${it.size}` : ''}
                          {it.size && it.color ? ' · ' : ''}
                          {it.color || ''}
                          {it.quantity ? ` · Qty ${it.quantity}` : ''}
                        </Text>
                      )}
                      <Text style={itemPriceLine}>
                        {fmt(it.price)}{' '}
                        {it.originalPrice && it.price && it.originalPrice > it.price && (
                          <>
                            <span style={strikePrice}>{fmt(it.originalPrice)}</span>{' '}
                            <span style={discountTag}>
                              {Math.round(((it.originalPrice - it.price) / it.originalPrice) * 100)}% off
                            </span>
                          </>
                        )}
                      </Text>
                      {it.originalPrice && it.price && it.originalPrice > it.price && (
                        <Text style={savingsLine}>
                          You save {fmt((it.originalPrice - it.price) * (it.quantity || 1))}
                        </Text>
                      )}
                    </Column>
                    <Column align="right" style={itemTotalCol}>
                      <Text style={itemTotal}>
                        {fmt((it.price || 0) * (it.quantity || 1))}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}

              {/* SUMMARY */}
              <Hr style={summaryHr} />
              {subtotal !== undefined && (
                <Row style={summaryRow}>
                  <Column>
                    <Text style={summaryKey}>Sub Total</Text>
                  </Column>
                  <Column align="right">
                    <Text style={summaryValue}>{fmt(subtotal)}</Text>
                  </Column>
                </Row>
              )}
              {shippingCost !== undefined && (
                <Row style={summaryRow}>
                  <Column>
                    <Text style={summaryKey}>Shipping</Text>
                  </Column>
                  <Column align="right">
                    <Text style={summaryValue}>
                      {shippingCost === 0 ? 'FREE' : fmt(shippingCost)}
                    </Text>
                  </Column>
                </Row>
              )}
              {totalSavings > 0 && (
                <Row style={summaryRow}>
                  <Column>
                    <Text style={summaryKeySave}>Total savings</Text>
                  </Column>
                  <Column align="right">
                    <Text style={summaryValueSave}>− {fmt(totalSavings)}</Text>
                  </Column>
                </Row>
              )}
              {orderTotal !== undefined && (
                <Row style={summaryRowGrand}>
                  <Column>
                    <Text style={grandKey}>Total Paid</Text>
                  </Column>
                  <Column align="right">
                    <Text style={grandValue}>{fmt(orderTotal)}</Text>
                  </Column>
                </Row>
              )}
              {paymentMethod && (
                <Text style={paymentLine}>Payment: {paymentMethod}</Text>
              )}
            </Section>
          )}

          {/* If no items — fallback summary */}
          {(!items || items.length === 0) && orderTotal !== undefined && (
            <Section style={itemsCard}>
              {itemCount !== undefined && (
                <Text style={bodyText}>
                  <strong>{itemCount}</strong> item{itemCount === 1 ? '' : 's'} confirmed.
                </Text>
              )}
              <Text style={bodyText}>
                <strong>Total Paid: {fmt(orderTotal)}</strong>
                {paymentMethod ? ` · ${paymentMethod}` : ''}
              </Text>
            </Section>
          )}

          {/* CTA STRIP */}
          <Section style={ctaStrip}>
            <Button
              href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}
              style={primaryBtn}
            >
              Track Your Order
            </Button>
          </Section>

          {/* FOOTER */}
          <Hr style={footerHr} />
          <Text style={footerText}>
            Need help? Reply to this email or visit{' '}
            <a href={`${SITE_URL}/contact`} style={footerLink}>
              our support page
            </a>
            .
          </Text>
          <Text style={footerBrand}>
            {SITE_NAME} · {SITE_URL.replace('https://', '')}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderPlacedEmail,
  subject: (data: Record<string, any>) => {
    const item = (data.items && data.items[0]?.name) || 'Your order'
    const more = data.items && data.items.length > 1 ? ` +(${data.items.length - 1})` : ''
    return `Success! Your MUFFIGOUT order of ${item}${more} is confirmed`
  },
  displayName: 'Order placed confirmation',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'MGH51866093',
    orderTotal: 1612,
    subtotal: 1747,
    shippingCost: 0,
    paymentMethod: 'Online Payment (PayU)',
    itemCount: 2,
    orderDate: 'Mon, 26 May 2025',
    estimatedDelivery: 'Mon, 02 Jun 2025',
    shippingAddress: { full_name: 'Aliasgar', pincode: '411048' },
    items: [
      {
        name: 'MUFFIGOUT Straight Track Pants with Cargo Pockets',
        image: 'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/muffigout-logo.png',
        size: '3XL',
        quantity: 1,
        price: 848,
        originalPrice: 1999,
      },
      {
        name: 'MUFFIGOUT Relaxed Fit Jeans',
        image: 'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/muffigout-logo.png',
        size: '46',
        quantity: 1,
        price: 764,
        originalPrice: 1599,
      },
    ],
  },
} satisfies TemplateEntry

// ─── STYLES ─────────────────────────────────────────────────
// Brand: primary HSL(250, 85%, 60%) = #6e4ce6, radius 10px

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
}
const outer = { maxWidth: '620px', margin: '0 auto', padding: '0' }

// Hero bar
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
  letterSpacing: '0.4px',
}
const heroOrderId = { fontSize: '11px', color: '#cabfff', margin: '4px 0 0' }
const heroOrderIdBold = { color: '#ffffff', fontWeight: 700 as const, textDecoration: 'underline' }

const trustStrip = {
  backgroundColor: '#e8f7f0',
  borderLeft: '3px solid #2dbf7e',
  padding: '12px 18px',
}
const trustText = { fontSize: '13px', color: '#2a6b50', margin: '0', lineHeight: '1.5' }

const whiteCard = { padding: '24px 24px 8px', backgroundColor: '#ffffff' }
const greeting = { fontSize: '16px', color: '#1a1a2e', margin: '0 0 12px' }
const bodyText = { fontSize: '14px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 12px' }

const detailsBanner = {
  backgroundColor: '#f4f1ff',
  padding: '20px 24px',
  margin: '8px 0 0',
}
const detailsHeading = {
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '17px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '0 0 12px',
}
const detailLine = { fontSize: '13px', color: '#3a3a4a', margin: '4px 0', lineHeight: '1.5' }
const detailKey = { color: '#6e4ce6', fontWeight: 600 as const }
const detailValue = { color: '#1a1a2e', fontWeight: 500 as const }

const darkPillBtn = {
  backgroundColor: '#1a1a2e',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '10px 20px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}

const itemsCard = { backgroundColor: '#f4f1ff', padding: '20px 24px', marginTop: '1px' }
const itemsHeading = {
  fontFamily: '"Space Grotesk", Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '0 0 16px',
}
const itemRow = { padding: '12px 0', borderBottom: '1px solid #e2dafc' }
const itemRowLast = { padding: '12px 0' }
const itemImgCol = { width: '78px', verticalAlign: 'top' as const }
const itemImg = { borderRadius: '8px', objectFit: 'cover' as const, border: '1px solid #e2dafc' }
const itemImgPlaceholder = {
  width: '68px',
  height: '68px',
  borderRadius: '8px',
  backgroundColor: '#e2dafc',
}
const itemInfoCol = { verticalAlign: 'top' as const, paddingLeft: '4px' }
const itemTotalCol = { width: '80px', verticalAlign: 'top' as const }
const itemName = {
  fontSize: '14px',
  fontWeight: 600 as const,
  color: '#1a1a2e',
  margin: '0 0 4px',
  lineHeight: '1.35',
}
const itemMeta = { fontSize: '12px', color: '#6c6c7d', margin: '0 0 4px' }
const itemPriceLine = { fontSize: '13px', color: '#1a1a2e', margin: '0 0 2px', fontWeight: 600 as const }
const strikePrice = { color: '#9a9aa8', textDecoration: 'line-through', fontWeight: 400 as const, marginLeft: '4px' }
const discountTag = { color: '#2dbf7e', fontWeight: 600 as const, marginLeft: '4px', fontSize: '12px' }
const savingsLine = { fontSize: '12px', color: '#2dbf7e', margin: '0', fontWeight: 600 as const }
const itemTotal = { fontSize: '14px', fontWeight: 700 as const, color: '#1a1a2e', margin: '0' }

const summaryHr = { borderColor: '#d8cdfa', margin: '14px 0 8px' }
const summaryRow = { padding: '4px 0' }
const summaryRowGrand = { padding: '10px 0 4px', borderTop: '2px solid #6e4ce6', marginTop: '8px' }
const summaryKey = { fontSize: '13px', color: '#3a3a4a', margin: '0' }
const summaryValue = { fontSize: '13px', color: '#1a1a2e', margin: '0', fontWeight: 600 as const }
const summaryKeySave = { fontSize: '13px', color: '#2dbf7e', margin: '0', fontWeight: 600 as const }
const summaryValueSave = { fontSize: '13px', color: '#2dbf7e', margin: '0', fontWeight: 700 as const }
const grandKey = { fontSize: '15px', color: '#1a1a2e', margin: '0', fontWeight: 700 as const, fontFamily: '"Space Grotesk", Arial, sans-serif' }
const grandValue = { fontSize: '17px', color: '#6e4ce6', margin: '0', fontWeight: 700 as const, fontFamily: '"Space Grotesk", Arial, sans-serif' }
const paymentLine = { fontSize: '12px', color: '#6c6c7d', margin: '8px 0 0', textAlign: 'right' as const }

const ctaStrip = { padding: '24px', textAlign: 'center' as const, backgroundColor: '#ffffff' }
const primaryBtn = {
  backgroundColor: '#6e4ce6',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '10px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  boxShadow: '0 4px 14px rgba(110, 76, 230, 0.3)',
}

const footerHr = { borderColor: '#eceef2', margin: '8px 24px' }
const footerText = { fontSize: '12px', color: '#8a8a99', textAlign: 'center' as const, margin: '12px 24px 4px', lineHeight: '1.5' }
const footerLink = { color: '#6e4ce6', textDecoration: 'underline' }
const footerBrand = { fontSize: '11px', color: '#a0a0b0', textAlign: 'center' as const, margin: '0 24px 24px', letterSpacing: '0.02em' }
