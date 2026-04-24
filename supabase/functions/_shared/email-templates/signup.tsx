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
const BRAND_DOMAIN = 'muffigoutapparelhub.com'

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
        {/* Black brand header */}
        <Section style={header}>
          <Heading style={brandTitle}>{BRAND_NAME}</Heading>
          <Text style={brandDomain}>{BRAND_DOMAIN}</Text>
        </Section>

        {/* White body */}
        <Section style={body}>
          <Heading style={h1}>
            Welcome to<br />
            {BRAND_NAME}
          </Heading>

          <Text style={text}>
            Thank you for joining us. Please verify your email address to
            activate your account and get started.
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

/* ───────── styles ───────── */
const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const outerContainer = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#000000',
  padding: '40px 24px',
  textAlign: 'center' as const,
}

const brandTitle = {
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: 'bold' as const,
  letterSpacing: '2px',
  margin: '0 0 6px',
}

const brandDomain = {
  color: '#d1d5db',
  fontSize: '14px',
  margin: 0,
}

const body = {
  backgroundColor: '#ffffff',
  padding: '40px 32px 24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#111827',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  lineHeight: '1.25',
  margin: '0 0 24px',
}

const text = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 32px',
}

const buttonWrapper = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
}

const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '16px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const fallbackLabel = {
  color: '#9ca3af',
  fontSize: '13px',
  margin: '0 0 12px',
}

const linkBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}

const linkUrl = {
  color: '#2563eb',
  fontSize: '12px',
  textDecoration: 'none',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footerLinks = {
  color: '#111827',
  fontSize: '13px',
  margin: '0 0 16px',
}

const footerLink = {
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 600 as const,
}

const dot = {
  color: '#9ca3af',
  margin: '0 10px',
}

const copyright = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: 0,
}
