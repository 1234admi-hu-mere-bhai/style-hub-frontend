/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
const SITE_URL = 'https://muffigoutapparelhub.com'

interface OrderPlacedProps {
  customerName?: string
  orderNumber?: string
  orderTotal?: number
  paymentMethod?: string
  itemCount?: number
}

const OrderPlacedEmail = ({
  customerName,
  orderNumber,
  orderTotal,
  paymentMethod,
  itemCount,
}: OrderPlacedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} order {orderNumber || ''} is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUFFIGOUT</Heading>
        <Text style={tagline}>Crafted with Trust, Worn with Pride</Text>

        <Section style={card}>
          <Heading style={h1}>Order Confirmed 🎉</Heading>
          <Text style={text}>
            {customerName ? `Hi ${customerName},` : 'Hi there,'} thanks for shopping with us!
            Your order has been received and is being prepared.
          </Text>

          <Section style={detailBox}>
            {orderNumber && (
              <Text style={detailRow}>
                <span style={label}>Order Number:</span> <strong>{orderNumber}</strong>
              </Text>
            )}
            {itemCount !== undefined && (
              <Text style={detailRow}>
                <span style={label}>Items:</span> {itemCount}
              </Text>
            )}
            {paymentMethod && (
              <Text style={detailRow}>
                <span style={label}>Payment:</span> {paymentMethod}
              </Text>
            )}
            {orderTotal !== undefined && (
              <Text style={detailRow}>
                <span style={label}>Total Paid:</span>{' '}
                <strong>₹{Number(orderTotal).toLocaleString('en-IN')}</strong>
              </Text>
            )}
          </Section>

          <Button style={button} href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}>
            Track Your Order
          </Button>

          <Hr style={hr} />
          <Text style={small}>
            We'll email you again as soon as your order ships. Need help?
            Reply to this email or visit <a href={`${SITE_URL}/contact`} style={link}>our support page</a>.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderPlacedEmail,
  subject: (data: Record<string, any>) =>
    `Order ${data.orderNumber || ''} confirmed — ${SITE_NAME}`,
  displayName: 'Order placed confirmation',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'OD173372828273395123',
    orderTotal: 1499,
    paymentMethod: 'Online Payment (PayU)',
    itemCount: 2,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", Arial, sans-serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 20px' }
const brand = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '28px', fontWeight: 'bold' as const, color: '#5b3df5', letterSpacing: '2px', margin: '0 0 4px', textAlign: 'center' as const }
const tagline = { fontSize: '12px', color: '#888', textAlign: 'center' as const, margin: '0 0 24px', letterSpacing: '1px' }
const card = { backgroundColor: '#fafafa', borderRadius: '16px', padding: '32px 28px', border: '1px solid #efefef' }
const h1 = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '22px', fontWeight: 'bold' as const, color: '#1f1d33', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4a4a55', lineHeight: '1.6', margin: '0 0 24px' }
const detailBox = { backgroundColor: '#ffffff', border: '1px solid #ececec', borderRadius: '12px', padding: '16px 18px', margin: '0 0 24px' }
const detailRow = { fontSize: '14px', color: '#333', margin: '6px 0' }
const label = { color: '#888', display: 'inline-block' as const, minWidth: '110px' }
const button = { backgroundColor: '#5b3df5', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#ececec', margin: '28px 0 16px' }
const small = { fontSize: '13px', color: '#888', lineHeight: '1.5', margin: '0' }
const link = { color: '#5b3df5', textDecoration: 'underline' }
