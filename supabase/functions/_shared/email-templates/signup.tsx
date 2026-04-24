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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const BRAND_NAME = 'MUFFIGOUT'
const BRAND_TAGLINE = 'Apparel Hub'
const BRAND_DOMAIN = 'muffigoutapparelhub.com'

// Brand palette (HSL → hex equivalents from index.css design tokens)
// --primary 250 85% 60% → #6D3FED (vibrant purple)
// --accent  170 80% 45% → #17CFB1 (electric teal)
// --foreground 230 25% 12% → #18192B (charcoal)
// --muted-foreground 220 10% 46% → #6B7280
const PURPLE = '#6D3FED'
const PURPLE_DARK = '#5A1FE0'
const TEAL = '#17CFB1'
const INK = '#18192B'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const SOFT_BG = '#F7F7FB'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Verify your email to activate your {BRAND_NAME} account</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        {/* Gradient brand header (purple → teal) */}
        <Section style={header}>
          <Heading style={brandTitle}>{BRAND_NAME}</Heading>
          <Text style={brandSubtitle}>{BRAND_TAGLINE}</Text>
        </Section>

        {/* White body */}
        <Section style={body}>
          <Heading style={h1}>
            Welcome to <span style={brandAccent}>{BRAND_NAME}</span>
          </Heading>

          <Text style={tagline}>Crafted with Trust, Worn with Pride</Text>

          <Text style={text}>
            Thank you for joining us. Please verify your email address to
            activate your account and start shopping.
          </Text>

          <Section style={buttonWrapper}>
            <Button style={button} href={confirmationUrl}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={fallbackLabel}>
            If the button doesn't work, copy and paste this link:
          </Text>

          <Section style={linkBox}>
            <Link href={confirmationUrl} style={linkUrl}>
              {confirmationUrl}
            </Link>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            If you didn't create an account with {BRAND_NAME}, you can safely
            ignore this email.
          </Text>

          <Hr style={divider} />

          <Text style={footerLinks}>
            <Link href={`https://${BRAND_DOMAIN}/privacy-policy`} style={footerLink}>
              Privacy Policy
            </Link>
            <span style={dot}>•</span>
            <Link href={`https://${BRAND_DOMAIN}/terms-of-service`} style={footerLink}>
              Terms of Service
            </Link>
            <span style={dot}>•</span>
            <Link href={`https://${BRAND_DOMAIN}/contact`} style={footerLink}>
              Contact
            </Link>
          </Text>

          <Text style={copyright}>
            © {new Date().getFullYear()} {BRAND_NAME} ({BRAND_DOMAIN}). All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

/* ───────── styles (match website theme) ───────── */
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const outerContainer = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  overflow: 'hidden',
  border: `1px solid ${BORDER}`,
  boxShadow: '0 12px 40px rgba(109, 63, 237, 0.10)',
}

const header = {
  background: `linear-gradient(135deg, ${PURPLE} 0%, #8B5CF6 50%, ${TEAL} 100%)`,
  padding: '44px 24px 36px',
  textAlign: 'center' as const,
}

const brandTitle = {
  color: '#ffffff',
  fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
  fontSize: '34px',
  fontWeight: 700 as const,
  letterSpacing: '3px',
  margin: '0 0 6px',
}

const brandSubtitle = {
  color: 'rgba(255,255,255,0.92)',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: 0,
}

const body = {
  backgroundColor: '#ffffff',
  padding: '44px 32px 28px',
  textAlign: 'center' as const,
}

const h1 = {
  color: INK,
  fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
  fontSize: '28px',
  fontWeight: 700 as const,
  lineHeight: '1.25',
  margin: '0 0 8px',
}

const brandAccent = {
  color: PURPLE,
}

const tagline = {
  color: TEAL,
  fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
  fontSize: '13px',
  fontWeight: 600 as const,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 22px',
}

const text = {
  color: '#4b5563',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '15px',
  lineHeight: '1.65',
  margin: '0 0 32px',
}

const buttonWrapper = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
}

const button = {
  background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)`,
  color: '#ffffff',
  fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
  fontSize: '15px',
  fontWeight: 600 as const,
  letterSpacing: '0.3px',
  borderRadius: '9999px',
  padding: '16px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 8px 24px rgba(109, 63, 237, 0.35)',
}

const fallbackLabel = {
  color: MUTED,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '13px',
  margin: '0 0 12px',
}

const linkBox = {
  backgroundColor: SOFT_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: '12px',
  padding: '14px 18px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}

const linkUrl = {
  color: PURPLE,
  fontSize: '12px',
  textDecoration: 'none',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

const footer = {
  backgroundColor: SOFT_BG,
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderTop: `1px solid ${BORDER}`,
}

const footerText = {
  color: MUTED,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const divider = {
  borderColor: BORDER,
  margin: '20px 0',
}

const footerLinks = {
  color: INK,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '13px',
  margin: '0 0 16px',
}

const footerLink = {
  color: PURPLE,
  textDecoration: 'none',
  fontWeight: 600 as const,
}

const dot = {
  color: '#9ca3af',
  margin: '0 10px',
}

const copyright = {
  color: '#9ca3af',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '12px',
  margin: 0,
}
