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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'
const SUPPORT_EMAIL = 'support@muffigoutapparelhub.com'
const SITE_URL = 'https://www.muffigoutapparelhub.com'

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header / Logo */}
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="64" height="64" alt={siteName} style={logo} />
          <Text style={brandName}>MUFFIGOUT</Text>
          <Text style={brandSub}>— APPAREL HUB —</Text>
        </Section>

        {/* Hero icon */}
        <Section style={heroIconSection}>
          <div style={heroIconCircle}>
            <Text style={heroIconEmoji}>✉️</Text>
          </div>
        </Section>

        {/* Title */}
        <Heading style={h1}>
          Confirm Your <span style={h1Accent}>Email Change</span>
        </Heading>
        <div style={accentDivider} />
        <Text style={subText}>
          We received a request to update the email address associated with your account.
        </Text>

        {/* Change details card with horizontal Current → New */}
        <Section style={detailsCard}>
          <div style={detailsBadge}>
            <Text style={detailsBadgeText}>CHANGE DETAILS</Text>
          </div>

          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={comparisonTable}>
            <tr>
              <td style={comparisonCell} align="left">
                <div style={emailIconCircleCurrent}>
                  <Text style={emailIconEmoji}>📧</Text>
                </div>
                <Text style={emailLabel}>Current Email</Text>
                <Text style={emailValue}>{email}</Text>
              </td>
              <td style={arrowCell} align="center">
                <div style={arrowCircle}>
                  <Text style={arrowText}>→</Text>
                </div>
              </td>
              <td style={comparisonCell} align="right">
                <div style={emailIconCircleNew}>
                  <Text style={emailIconEmoji}>📨</Text>
                </div>
                <Text style={emailLabel}>New Email</Text>
                <Text style={emailValue}>{newEmail}</Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* CTA grouped card */}
        <Section style={ctaCard}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td width="60" valign="middle" style={{ paddingRight: '14px' }}>
                <div style={lockIconCircle}>
                  <Text style={lockIconEmoji}>🔒</Text>
                </div>
              </td>
              <td valign="middle">
                <Text style={ctaHelperText}>
                  To confirm this change, please click the button.
                </Text>
              </td>
            </tr>
          </table>
          <Section style={{ textAlign: 'center', marginTop: '18px' }}>
            <Button style={button} href={confirmationUrl}>
              CONFIRM EMAIL CHANGE  →
            </Button>
          </Section>
        </Section>

        {/* Two-column safety + help footer */}
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: '28px' }}>
          <tr>
            <td width="48%" valign="top" style={safetyCell}>
              <div style={warningIconWrap}>
                <Text style={warningEmoji}>⚠️</Text>
              </div>
              <Text style={safetyTitle}>Didn't request this?</Text>
              <Text style={safetyText}>
                If you didn't make this request, please ignore this email or{' '}
                <span style={accentDanger}>secure your account</span> immediately.
              </Text>
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top" style={helpCell}>
              <div style={helpIconWrap}>
                <Text style={helpEmoji}>🎧</Text>
              </div>
              <Text style={helpTitle}>Need help?</Text>
              <Text style={helpText}>
                If you have any questions or concerns, our support team is here to help.
              </Text>
              <Text style={contactRow}>
                <Link href={`mailto:${SUPPORT_EMAIL}`} style={contactLink}>
                  ✉  {SUPPORT_EMAIL}
                </Link>
              </Text>
              <Text style={contactRow}>
                <Link href={SITE_URL} style={contactLink}>
                  🌐  www.muffigoutapparelhub.com
                </Link>
              </Text>
            </td>
          </tr>
        </table>

        {/* Sign-off */}
        <Hr style={signoffHr} />
        <Section style={{ textAlign: 'center' }}>
          <Text style={thanksScript}>Thanks,</Text>
          <Text style={signOffName}>The Muffigout Apparel Hub Team</Text>
          <Text style={securityNote}>
            <span style={shieldDot}>🛡</span>  Your security is our priority.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

/* ---------- Styles ---------- */

const PURPLE = '#6E56F8'
const PURPLE_DEEP = '#4B33C9'
const PINK = '#E8456D'
const TEAL = '#14B8A6'
const INK = '#0F172A'
const MUTED = '#55575d'
const SOFT_BG = '#F7F6FE'
const BORDER = '#EAE7FB'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px 24px 32px',
  backgroundColor: '#ffffff',
}

const logoSection: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '8px',
  paddingBottom: '4px',
}

const logo: React.CSSProperties = {
  display: 'block',
  margin: '0 auto 6px',
  borderRadius: '14px',
}

const brandName: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  letterSpacing: '2px',
  color: INK,
  margin: '4px 0 0',
  textAlign: 'center',
}

const brandSub: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '4px',
  color: PURPLE,
  margin: '2px 0 18px',
  textAlign: 'center',
  fontWeight: 600,
}

const heroIconSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '8px 0 18px',
}

const heroIconCircle: React.CSSProperties = {
  display: 'inline-block',
  width: '78px',
  height: '78px',
  lineHeight: '78px',
  borderRadius: '50%',
  background: '#ffffff',
  border: `3px solid ${BORDER}`,
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(110,86,248,0.18)',
}

const heroIconEmoji: React.CSSProperties = {
  fontSize: '36px',
  margin: 0,
  lineHeight: '78px',
}

const h1: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: INK,
  margin: '8px 0 6px',
  textAlign: 'center',
  letterSpacing: '-0.3px',
}

const h1Accent: React.CSSProperties = {
  color: PURPLE,
}

const accentDivider: React.CSSProperties = {
  width: '54px',
  height: '3px',
  background: `linear-gradient(90deg, ${PURPLE}, ${PINK})`,
  margin: '6px auto 14px',
  borderRadius: '2px',
}

const subText: React.CSSProperties = {
  fontSize: '14px',
  color: MUTED,
  lineHeight: '1.6',
  margin: '0 auto 24px',
  textAlign: 'center',
  maxWidth: '460px',
}

const detailsCard: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: '14px',
  padding: '28px 18px 18px',
  backgroundColor: '#ffffff',
  position: 'relative',
  marginBottom: '20px',
  boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
}

const detailsBadge: React.CSSProperties = {
  position: 'absolute',
  top: '-14px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: `linear-gradient(90deg, ${PURPLE}, ${PINK})`,
  borderRadius: '999px',
  padding: '6px 18px',
  boxShadow: '0 4px 12px rgba(110,86,248,0.35)',
}

const detailsBadgeText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '1.5px',
  margin: 0,
}

const comparisonTable: React.CSSProperties = {
  marginTop: '8px',
}

const comparisonCell: React.CSSProperties = {
  padding: '8px',
  verticalAlign: 'middle',
  width: '42%',
}

const arrowCell: React.CSSProperties = {
  width: '16%',
  textAlign: 'center',
  verticalAlign: 'middle',
}

const arrowCircle: React.CSSProperties = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  lineHeight: '30px',
  borderRadius: '50%',
  border: `1.5px dashed ${PINK}`,
  textAlign: 'center',
  color: PINK,
}

const arrowText: React.CSSProperties = {
  margin: 0,
  color: PINK,
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '30px',
}

const emailIconCircleCurrent: React.CSSProperties = {
  display: 'inline-block',
  width: '46px',
  height: '46px',
  lineHeight: '46px',
  borderRadius: '50%',
  backgroundColor: '#EFEBFE',
  textAlign: 'center',
  marginBottom: '8px',
}

const emailIconCircleNew: React.CSSProperties = {
  display: 'inline-block',
  width: '46px',
  height: '46px',
  lineHeight: '46px',
  borderRadius: '50%',
  backgroundColor: '#FDE7EE',
  textAlign: 'center',
  marginBottom: '8px',
}

const emailIconEmoji: React.CSSProperties = {
  fontSize: '20px',
  margin: 0,
  lineHeight: '46px',
}

const emailLabel: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '0 0 4px',
  fontWeight: 500,
}

const emailValue: React.CSSProperties = {
  fontSize: '14px',
  color: INK,
  margin: 0,
  fontWeight: 700,
  wordBreak: 'break-all',
}

const ctaCard: React.CSSProperties = {
  border: `1.5px dashed ${BORDER}`,
  borderRadius: '14px',
  padding: '18px',
  backgroundColor: SOFT_BG,
}

const lockIconCircle: React.CSSProperties = {
  display: 'inline-block',
  width: '46px',
  height: '46px',
  lineHeight: '46px',
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`,
  textAlign: 'center',
  boxShadow: '0 6px 16px rgba(75,51,201,0.35)',
}

const lockIconEmoji: React.CSSProperties = {
  fontSize: '20px',
  color: '#ffffff',
  margin: 0,
  lineHeight: '46px',
}

const ctaHelperText: React.CSSProperties = {
  fontSize: '14px',
  color: INK,
  margin: 0,
  fontWeight: 500,
  lineHeight: '1.45',
}

const button: React.CSSProperties = {
  background: `linear-gradient(90deg, ${PURPLE}, ${PINK})`,
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '1px',
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 10px 24px rgba(110,86,248,0.4)',
}

const safetyCell: React.CSSProperties = {
  backgroundColor: '#FFF1F3',
  border: '1px solid #FBD5DD',
  borderRadius: '14px',
  padding: '18px 16px',
  verticalAlign: 'top',
}

const helpCell: React.CSSProperties = {
  backgroundColor: '#ECFDF5',
  border: '1px solid #BBF7D9',
  borderRadius: '14px',
  padding: '18px 16px',
  verticalAlign: 'top',
}

const warningIconWrap: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
}

const warningEmoji: React.CSSProperties = {
  fontSize: '28px',
  margin: 0,
}

const helpIconWrap: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
}

const helpEmoji: React.CSSProperties = {
  fontSize: '28px',
  margin: 0,
}

const safetyTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  color: PINK,
  margin: '0 0 6px',
  textAlign: 'center',
}

const helpTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  color: TEAL,
  margin: '0 0 6px',
  textAlign: 'center',
}

const safetyText: React.CSSProperties = {
  fontSize: '12.5px',
  color: MUTED,
  margin: 0,
  lineHeight: '1.55',
  textAlign: 'center',
}

const helpText: React.CSSProperties = {
  fontSize: '12.5px',
  color: MUTED,
  margin: '0 0 10px',
  lineHeight: '1.55',
  textAlign: 'center',
}

const accentDanger: React.CSSProperties = {
  color: PINK,
  fontWeight: 700,
}

const contactRow: React.CSSProperties = {
  fontSize: '12.5px',
  margin: '4px 0 0',
  textAlign: 'left',
}

const contactLink: React.CSSProperties = {
  color: TEAL,
  textDecoration: 'none',
  fontWeight: 600,
}

const signoffHr: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${BORDER}`,
  margin: '28px 0 16px',
}

const thanksScript: React.CSSProperties = {
  fontSize: '18px',
  fontStyle: 'italic',
  color: PURPLE,
  margin: '0 0 4px',
  fontFamily: "'Brush Script MT', cursive",
  textAlign: 'center',
}

const signOffName: React.CSSProperties = {
  fontSize: '14px',
  color: INK,
  fontWeight: 700,
  margin: '0 0 8px',
  textAlign: 'center',
}

const securityNote: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '6px 0 0',
  textAlign: 'center',
}

const shieldDot: React.CSSProperties = {
  color: PURPLE,
}
