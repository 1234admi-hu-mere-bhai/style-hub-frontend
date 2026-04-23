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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/muffigout-logo.png'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={outer}>
        {/* Logo header */}
        <Section style={logoSection}>
          <Img
            src={LOGO_URL}
            width="56"
            height="56"
            alt={siteName}
            style={logo}
          />
        </Section>

        {/* Top heading */}
        <Heading style={topHeading}>
          Reset your {siteName} password
        </Heading>

        {/* Inner card */}
        <Section style={card}>
          <Heading as="h2" style={cardHeading}>
            Password reset request
          </Heading>

          <Text style={text}>
            We heard that you lost your {siteName} password. Sorry about that!
          </Text>

          <Text style={text}>
            But don&rsquo;t worry! You can use the button below to reset your
            password:
          </Text>

          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Reset your password
            </Button>
          </Section>

          <Text style={text}>
            If you don&rsquo;t use this link within 1 hour, it will expire.{' '}
            <Link href={confirmationUrl} style={link}>
              Click here to request a new password reset link
            </Link>
            .
          </Text>

          <Hr style={hr} />

          <Text style={signoff}>
            Thanks,
            <br />
            The {siteName} Team
          </Text>
        </Section>

        {/* Outer footer */}
        <Text style={footer}>
          You&rsquo;re receiving this email because a password reset was
          requested for your account.
        </Text>
        <Text style={brandFooter}>
          {siteName} &middot; Crafted with Trust, Worn with Pride
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

// --- Styles -----------------------------------------------------------------
// Brand: primary 250 85% 60% (purple), radius 0.625rem (10px)

const main = {
  backgroundColor: '#f4f4f7',
  fontFamily:
    '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
}

const outer = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 16px',
}

const logoSection = {
  textAlign: 'center' as const,
  padding: '0 0 16px',
}

const logo = {
  display: 'inline-block',
  borderRadius: '12px',
}

const topHeading = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: '#1a1a2e',
  margin: '0 0 20px',
  textAlign: 'left' as const,
  fontFamily:
    '"Space Grotesk", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
  letterSpacing: '-0.01em',
}

const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '28px 28px 24px',
}

const cardHeading = {
  fontSize: '18px',
  fontWeight: 600 as const,
  color: '#1a1a2e',
  margin: '0 0 18px',
  fontFamily:
    '"Space Grotesk", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
}

const text = {
  fontSize: '15px',
  color: '#3a3a4a',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const buttonWrap = {
  textAlign: 'center' as const,
  padding: '8px 0 20px',
}

const button = {
  backgroundColor: 'hsl(250, 85%, 60%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '13px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 4px 12px rgba(110, 76, 230, 0.25)',
}

const link = {
  color: 'hsl(250, 85%, 60%)',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#eceef2',
  margin: '24px 0 18px',
}

const signoff = {
  fontSize: '14px',
  color: '#3a3a4a',
  lineHeight: '1.6',
  margin: '0',
}

const footer = {
  fontSize: '12px',
  color: '#8a8a99',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '24px 0 8px',
  padding: '0 12px',
}

const brandFooter = {
  fontSize: '11px',
  color: '#a0a0b0',
  textAlign: 'center' as const,
  margin: '0',
  letterSpacing: '0.02em',
}
