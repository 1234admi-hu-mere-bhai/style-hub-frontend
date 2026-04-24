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
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const SITE_URL = 'https://muffigoutapparelhub.com'
const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'

interface RefundProcessedProps {
  customerName?: string
  orderNumber?: string
  refundAmount?: number
  refundMethod?: string
}

const RefundProcessedEmail = ({
  customerName,
  orderNumber,
  refundAmount,
  refundMethod,
}: RefundProcessedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your refund has been processed 💸</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUFFIGOUT</Heading>
        <Text style={tagline}>Crafted with Trust, Worn with Pride</Text>

        <Section style={card}>
          <Heading style={h1}>Refund Processed 💸</Heading>
          <Text style={text}>
            {customerName ? `Hi ${customerName},` : 'Hi there,'} your refund has been
            issued successfully.
          </Text>

          <Section style={detailBox}>
            {orderNumber && (
              <Text style={detailRow}>
                <span style={label}>Order:</span> <strong>{orderNumber}</strong>
              </Text>
            )}
            {refundAmount !== undefined && (
              <Text style={detailRow}>
                <span style={label}>Refund Amount:</span>{' '}
                <strong>₹{Number(refundAmount).toLocaleString('en-IN')}</strong>
              </Text>
            )}
            <Text style={detailRow}>
              <span style={label}>Refunded to:</span>{' '}
              {refundMethod === 'source' || !refundMethod
                ? 'Original payment method'
                : refundMethod}
            </Text>
          </Section>

          <Text style={text}>
            The amount should reflect in your account within{' '}
            <strong>5–7 business days</strong>, depending on your bank.
          </Text>

          <Button style={button} href={`${SITE_URL}/track-order${orderNumber ? `?id=${orderNumber}` : ''}`}>
            View Order
          </Button>

          <Hr style={hr} />
          <Text style={small}>
            Questions about your refund? Reply to this email or visit{' '}
            <a href={`${SITE_URL}/contact`} style={link}>our support page</a>.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RefundProcessedEmail,
  subject: (data: Record<string, any>) =>
    `Refund processed for order ${data.orderNumber ? `••••${String(data.orderNumber).slice(-4)}` : ''} — ${SITE_NAME}`,
  displayName: 'Refund processed notification',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'OD173372828273395123',
    refundAmount: 1499,
    refundMethod: 'source',
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
