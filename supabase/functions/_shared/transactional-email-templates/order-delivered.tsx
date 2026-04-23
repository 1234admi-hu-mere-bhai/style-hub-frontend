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

interface OrderDeliveredProps {
  customerName?: string
  orderNumber?: string
}

const OrderDeliveredEmail = ({
  customerName,
  orderNumber,
}: OrderDeliveredProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} order has been delivered ✅</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUFFIGOUT</Heading>
        <Text style={tagline}>Crafted with Trust, Worn with Pride</Text>

        <Section style={card}>
          <Heading style={h1}>Delivered ✅</Heading>
          <Text style={text}>
            {customerName ? `Hi ${customerName},` : 'Hi there,'} your order
            {orderNumber ? <> <strong>{orderNumber}</strong></> : ''} has been
            delivered. We hope you love what you ordered!
          </Text>

          <Text style={text}>
            Loved your purchase? A quick review goes a long way and helps
            other shoppers discover MUFFIGOUT.
          </Text>

          <Button style={button} href={`${SITE_URL}/profile?tab=orders`}>
            Leave a Review
          </Button>

          <Hr style={hr} />
          <Text style={small}>
            Need to return or replace an item? You have <strong>7 days</strong>{' '}
            from delivery. Visit <a href={`${SITE_URL}/return-exchange`} style={link}>Returns &amp; Exchange</a>.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderDeliveredEmail,
  subject: (data: Record<string, any>) =>
    `Order ${data.orderNumber || ''} delivered — enjoy! 🎁`,
  displayName: 'Order delivered notification',
  previewData: {
    customerName: 'Aliasgar',
    orderNumber: 'OD173372828273395123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", Arial, sans-serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 20px' }
const brand = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '28px', fontWeight: 'bold' as const, color: '#5b3df5', letterSpacing: '2px', margin: '0 0 4px', textAlign: 'center' as const }
const tagline = { fontSize: '12px', color: '#888', textAlign: 'center' as const, margin: '0 0 24px', letterSpacing: '1px' }
const card = { backgroundColor: '#fafafa', borderRadius: '16px', padding: '32px 28px', border: '1px solid #efefef' }
const h1 = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '22px', fontWeight: 'bold' as const, color: '#1f1d33', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4a4a55', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#5b3df5', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#ececec', margin: '28px 0 16px' }
const small = { fontSize: '13px', color: '#888', lineHeight: '1.5', margin: '0' }
const link = { color: '#5b3df5', textDecoration: 'underline' }
