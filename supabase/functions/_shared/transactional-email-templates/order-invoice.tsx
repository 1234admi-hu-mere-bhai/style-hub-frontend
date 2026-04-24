/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
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
const SUPPORT_EMAIL = 'support@muffigoutapparelhub.com'
const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'

interface InvoiceItem {
  name: string
  size?: string
  color?: string
  quantity?: number
  price?: number
}

interface InvoiceProps {
  customerName?: string
  orderNumber?: string
  invoiceNumber?: string
  orderDate?: string
  paymentMethod?: string
  paymentId?: string
  subtotal?: number
  shippingCost?: number
  total?: number
  items?: InvoiceItem[]
  shippingAddress?: {
    full_name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  }
}

const fmt = (n?: number) =>
  n === undefined || n === null
    ? '—'
    : `₹${Number(n).toLocaleString('en-IN')}`

const OrderInvoiceEmail = ({
  customerName,
  orderNumber,
  invoiceNumber,
  orderDate,
  paymentMethod,
  paymentId,
  subtotal,
  shippingCost,
  total,
  items = [],
  shippingAddress,
}: InvoiceProps) => {
  const invoiceNo = invoiceNumber || (orderNumber ? `INV-${orderNumber.slice(-8)}` : '')

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Tax invoice for order {orderNumber ? `••••${orderNumber.slice(-4)}` : ''} — {fmt(total)}
      </Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* HEADER */}
          <Section style={headerBar}>
            <Row>
              <Column style={{ verticalAlign: 'middle' }}>
                <Img src={LOGO_URL} width="36" height="36" alt={SITE_NAME} style={logoImg} />
                <Text style={brandText}>MUFFIGOUT</Text>
              </Column>
              <Column align="right" style={{ verticalAlign: 'middle' }}>
                <Text style={badge}>Tax Invoice</Text>
                {invoiceNo && <Text style={invoiceNoText}>{invoiceNo}</Text>}
              </Column>
            </Row>
          </Section>

          {/* GREETING */}
          <Section style={padded}>
            <Heading as="h1" style={h1}>
              {customerName ? `Hi ${customerName},` : 'Hi there,'}
            </Heading>
            <Text style={lead}>
              Thank you for shopping with {SITE_NAME}. Here is the tax invoice for your recent order.
              Please retain this for your records.
            </Text>
          </Section>

          {/* INVOICE META */}
          <Section style={metaCard}>
            <Row>
              <Column style={metaCol}>
                <Text style={metaLabel}>Invoice No.</Text>
                <Text style={metaValue}>{invoiceNo || '—'}</Text>
              </Column>
              <Column style={metaCol}>
                <Text style={metaLabel}>Order No.</Text>
                <Text style={metaValue}>{orderNumber || '—'}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={metaCol}>
                <Text style={metaLabel}>Date</Text>
                <Text style={metaValue}>{orderDate || '—'}</Text>
              </Column>
              <Column style={metaCol}>
                <Text style={metaLabel}>Payment</Text>
                <Text style={metaValue}>{paymentMethod || '—'}</Text>
              </Column>
            </Row>
            {paymentId && (
              <Row>
                <Column>
                  <Text style={metaLabel}>Payment Reference</Text>
                  <Text style={metaValueSmall}>{paymentId}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {/* BILL TO */}
          {shippingAddress && (
            <Section style={padded}>
              <Text style={sectionLabel}>BILL TO</Text>
              <Text style={addressName}>
                {shippingAddress.full_name || customerName || ''}
              </Text>
              <Text style={addressLine}>
                {shippingAddress.address || ''}
              </Text>
              <Text style={addressLine}>
                {[shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              {shippingAddress.phone && (
                <Text style={addressLine}>Phone: {shippingAddress.phone}</Text>
              )}
            </Section>
          )}

          <Hr style={hr} />

          {/* LINE ITEMS */}
          <Section style={padded}>
            <Text style={sectionLabel}>ITEMS</Text>
            <Section style={tableHeader}>
              <Row>
                <Column style={thItem}>Item</Column>
                <Column style={thQty} align="center">Qty</Column>
                <Column style={thAmt} align="right">Amount</Column>
              </Row>
            </Section>
            {items.map((it, i) => {
              const qty = Number(it.quantity) || 1
              const lineTotal = (Number(it.price) || 0) * qty
              const variant = [it.size, it.color].filter(Boolean).join(' • ')
              return (
                <Section key={i} style={tableRow}>
                  <Row>
                    <Column style={tdItem}>
                      <Text style={itemName}>{it.name}</Text>
                      {variant && <Text style={itemVariant}>{variant}</Text>}
                      <Text style={itemUnit}>{fmt(it.price)} each</Text>
                    </Column>
                    <Column style={tdQty} align="center">
                      <Text style={qtyText}>{qty}</Text>
                    </Column>
                    <Column style={tdAmt} align="right">
                      <Text style={amtText}>{fmt(lineTotal)}</Text>
                    </Column>
                  </Row>
                </Section>
              )
            })}
          </Section>

          {/* TOTALS */}
          <Section style={totalsCard}>
            <Row>
              <Column><Text style={totalLabel}>Subtotal</Text></Column>
              <Column align="right"><Text style={totalValue}>{fmt(subtotal)}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={totalLabel}>Shipping</Text></Column>
              <Column align="right">
                <Text style={totalValue}>
                  {shippingCost && shippingCost > 0 ? fmt(shippingCost) : 'FREE'}
                </Text>
              </Column>
            </Row>
            <Hr style={totalsDivider} />
            <Row>
              <Column><Text style={grandLabel}>Total Paid</Text></Column>
              <Column align="right"><Text style={grandValue}>{fmt(total)}</Text></Column>
            </Row>
            <Text style={taxNote}>All prices are inclusive of applicable taxes.</Text>
          </Section>

          {/* FOOTER */}
          <Section style={padded}>
            <Text style={footerNote}>
              Need help with this invoice? Reply to this email or contact us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a>.
            </Text>
            <Text style={footerBrand}>
              {SITE_NAME} • <a href={SITE_URL} style={link}>{SITE_URL.replace('https://', '')}</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderInvoiceEmail,
  subject: (d: Record<string, any>) =>
    `Tax Invoice for your order${d?.orderNumber ? ` ••••${String(d.orderNumber).slice(-4)}` : ''}`,
  displayName: 'Order Invoice',
  previewData: {
    customerName: 'Aarav',
    orderNumber: 'OD17345678901234567',
    orderDate: 'Wed, 24 Apr 2026',
    paymentMethod: 'Online Payment (PayU)',
    paymentId: '403993715533456789',
    subtotal: 2499,
    shippingCost: 0,
    total: 2499,
    items: [
      { name: 'Classic Cotton Tee', size: 'L', color: 'Black', quantity: 1, price: 999 },
      { name: 'Slim Fit Chinos', size: '32', color: 'Olive', quantity: 1, price: 1500 },
    ],
    shippingAddress: {
      full_name: 'Aarav Sharma',
      address: '12, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 90000 00000',
    },
  },
} satisfies TemplateEntry

// ===== Styles =====
const main = { backgroundColor: '#f4f4f6', fontFamily: 'Arial, Helvetica, sans-serif' }
const outer = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }
const padded = { padding: '24px 28px' }

const headerBar = {
  backgroundColor: '#1a1a2e',
  padding: '20px 28px',
}
const logoImg = { display: 'inline-block', verticalAlign: 'middle', borderRadius: '6px' }
const brandText = {
  display: 'inline-block',
  marginLeft: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 700,
  letterSpacing: '1px',
  verticalAlign: 'middle',
}
const badge = {
  display: 'inline-block',
  backgroundColor: '#a855f7',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
  padding: '4px 10px',
  borderRadius: '999px',
  margin: 0,
}
const invoiceNoText = {
  color: '#cbd5e1',
  fontSize: '12px',
  margin: '6px 0 0',
}

const h1 = { fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }
const lead = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: 0 }

const metaCard = {
  backgroundColor: '#faf7ff',
  border: '1px solid #ede7fa',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '0 28px',
}
const metaCol = { padding: '6px 0' }
const metaLabel = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '1px',
  color: '#7c3aed',
  margin: '0 0 2px',
  textTransform: 'uppercase' as const,
}
const metaValue = { fontSize: '13px', fontWeight: 600, color: '#1a1a2e', margin: 0 }
const metaValueSmall = { fontSize: '11px', color: '#55575d', margin: 0, wordBreak: 'break-all' as const }

const sectionLabel = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
  color: '#7c3aed',
  margin: '0 0 8px',
}
const addressName = { fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 2px' }
const addressLine = { fontSize: '13px', color: '#55575d', margin: '0 0 2px', lineHeight: '1.5' }

const hr = { borderColor: '#eeeeee', margin: '8px 28px' }

const tableHeader = {
  backgroundColor: '#f4f4f6',
  borderRadius: '6px',
  padding: '8px 10px',
}
const thItem = { fontSize: '11px', fontWeight: 700, color: '#55575d', letterSpacing: '0.5px' }
const thQty = { fontSize: '11px', fontWeight: 700, color: '#55575d', letterSpacing: '0.5px', width: '60px' }
const thAmt = { fontSize: '11px', fontWeight: 700, color: '#55575d', letterSpacing: '0.5px', width: '100px' }

const tableRow = { padding: '10px', borderBottom: '1px solid #f0f0f0' }
const tdItem = { paddingRight: '8px' }
const tdQty = { width: '60px' }
const tdAmt = { width: '100px' }
const itemName = { fontSize: '13px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 2px' }
const itemVariant = { fontSize: '11px', color: '#55575d', margin: '0 0 2px' }
const itemUnit = { fontSize: '11px', color: '#888', margin: 0 }
const qtyText = { fontSize: '13px', color: '#1a1a2e', fontWeight: 600, margin: 0 }
const amtText = { fontSize: '13px', color: '#1a1a2e', fontWeight: 600, margin: 0 }

const totalsCard = {
  backgroundColor: '#1a1a2e',
  borderRadius: '10px',
  padding: '18px 22px',
  margin: '16px 28px',
}
const totalLabel = { fontSize: '13px', color: '#cbd5e1', margin: '4px 0' }
const totalValue = { fontSize: '13px', color: '#ffffff', fontWeight: 600, margin: '4px 0' }
const totalsDivider = { borderColor: '#3a3a52', margin: '8px 0' }
const grandLabel = { fontSize: '15px', color: '#ffffff', fontWeight: 700, margin: '4px 0' }
const grandValue = { fontSize: '17px', color: '#a855f7', fontWeight: 700, margin: '4px 0' }
const taxNote = { fontSize: '11px', color: '#94a3b8', margin: '10px 0 0', fontStyle: 'italic' as const }

const footerNote = { fontSize: '12px', color: '#55575d', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '11px', color: '#888', margin: 0 }
const link = { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }
