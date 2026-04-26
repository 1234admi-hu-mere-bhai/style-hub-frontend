/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
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
const HEX_ENVELOPE_URL = 'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/email-change/hex-envelope.png'
const LOCK_3D_URL = 'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/email-change/lock-3d.png'
const HEADSET_3D_URL = 'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/email-change/headset-3d.png'
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
        {/* Gradient hero band with logo */}
        <Section style={heroBand}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="right" style={{ paddingBottom: '8px' }}>
                <Text style={browserText}>
                  Can't see this email?{' '}
                  <Link href={confirmationUrl} style={browserLink}>
                    View in browser
                  </Link>
                </Text>
              </td>
            </tr>
            <tr>
              <td align="center" style={{ paddingTop: '6px' }}>
                <Img
                  src={LOGO_URL}
                  width="56"
                  height="56"
                  alt={siteName}
                  style={logoImg}
                />
                <Text style={brandName}>Muffi Gout</Text>
                <Text style={brandSub}>— APPAREL HUB —</Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* Wave divider into white */}
        <Section style={waveSection}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="center" style={waveTop}></td>
            </tr>
          </table>

          {/* Hex envelope icon overlapping wave */}
          <Section style={{ textAlign: 'center', marginTop: '-46px' }}>
            <Img
              src={HEX_ENVELOPE_URL}
              width="96"
              height="96"
              alt=""
              style={hexImg}
            />
          </Section>
        </Section>

        {/* Title block */}
        <Section style={{ textAlign: 'center', padding: '12px 24px 0' }}>
          <Heading style={h1}>
            Confirm Your<br />
            <span style={h1Accent}>Email Change</span>
          </Heading>
          <Text style={subText}>
            We received a request to update the email address associated with your account.
          </Text>
          <div style={accentDivider} />
        </Section>

        {/* Account update card — vertical Current → New */}
        <Section style={detailsCard}>
          <Text style={detailsHeader}>
            <span style={detailsDash}>—</span>{' '}
            <span style={detailsHeaderText}>ACCOUNT UPDATE</span>{' '}
            <span style={detailsDash}>—</span>
          </Text>

          {/* Current email row */}
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td width="64" valign="middle" style={{ paddingRight: '12px' }}>
                <div style={emailIconCircleCurrent}>
                  <Text style={emailIconEmoji}>✉</Text>
                </div>
              </td>
              <td valign="middle">
                <Text style={emailLabel}>Current Email</Text>
                <Text style={emailValue}>{email}</Text>
              </td>
            </tr>
          </table>

          {/* Connector line */}
          <div style={connectorLineWrap}>
            <div style={connectorLine} />
          </div>

          {/* New email row */}
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td width="64" valign="middle" style={{ paddingRight: '12px' }}>
                <div style={emailIconCircleNew}>
                  <Text style={emailIconEmoji}>✉</Text>
                </div>
              </td>
              <td valign="middle">
                <Text style={emailLabel}>New Email</Text>
                <Text style={emailValueNew}>{newEmail}</Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* Pill CTA with lock icon inside */}
        <Section style={{ textAlign: 'center', padding: '8px 24px 4px' }}>
          <Button style={button} href={confirmationUrl}>
            <span style={buttonLockIcon}>🔒</span>
            <span style={buttonLabel}>CONFIRM EMAIL CHANGE</span>
            <span style={buttonArrow}>→</span>
          </Button>
        </Section>

        {/* Security Comes First — dark card with 3D lock */}
        <Section style={securityCard}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td valign="top" style={{ paddingRight: '8px' }}>
                <Text style={securityTitle}>Security Comes First</Text>
                <Text style={securityText}>
                  If you didn't request this change, please ignore this email or{' '}
                  <Link href={SITE_URL} style={securityLink}>
                    secure your account
                  </Link>{' '}
                  immediately.
                </Text>
              </td>
              <td width="110" align="right" valign="middle">
                <Img
                  src={LOCK_3D_URL}
                  width="100"
                  height="100"
                  alt=""
                  style={{ display: 'block' }}
                />
              </td>
            </tr>
          </table>
        </Section>

        {/* Need help — light card with 3D headset */}
        <Section style={helpCard}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td valign="top" style={{ paddingRight: '8px' }}>
                <Text style={helpTitle}>Need Help? We're Here!</Text>
                <Text style={helpText}>
                  If you have any questions or concerns, our support team is ready to assist you.
                </Text>
              </td>
              <td width="110" align="right" valign="middle">
                <Img
                  src={HEADSET_3D_URL}
                  width="100"
                  height="100"
                  alt=""
                  style={{ display: 'block' }}
                />
              </td>
            </tr>
          </table>

          {/* Two-column contact pills */}
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: '14px' }}>
            <tr>
              <td width="49%" style={{ paddingRight: '6px' }}>
                <Link href={`mailto:${SUPPORT_EMAIL}`} style={contactPill}>
                  <span style={contactPillIcon}>✉</span>
                  <span style={contactPillText}>{SUPPORT_EMAIL}</span>
                </Link>
              </td>
              <td width="2%"></td>
              <td width="49%" style={{ paddingLeft: '6px' }}>
                <Link href={SITE_URL} style={contactPill}>
                  <span style={contactPillIcon}>🌐</span>
                  <span style={contactPillText}>www.muffigoutapparelhub.com</span>
                </Link>
              </td>
            </tr>
          </table>
        </Section>

        {/* Sign-off */}
        <Section style={{ textAlign: 'center', padding: '24px 24px 8px' }}>
          <div style={shieldDot}>
            <Text style={shieldEmoji}>🛡</Text>
          </div>
          <Text style={thanksScript}>Thank you,</Text>
          <Text style={signOffName}>The Muffi Gout Apparel Hub Team</Text>
          <Text style={securityNote}>
            <span style={shieldInline}>🛡</span> Your security is our priority.
          </Text>
        </Section>

        {/* Gradient footer band with social icons */}
        <Section style={footerBand}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="center">
                <Link href="https://facebook.com" style={socialIcon}>f</Link>
                <Link href="https://instagram.com" style={socialIcon}>◉</Link>
                <Link href={SITE_URL} style={socialIcon}>◎</Link>
                <Link href={SITE_URL} style={socialIcon}>▶</Link>
              </td>
            </tr>
          </table>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

/* ---------- Styles ---------- */

const PURPLE = '#6E56F8'
const PURPLE_DEEP = '#4B33C9'
const BLUE = '#4F8BF6'
const PINK_HINT = '#A855F7'
const INK = '#0F172A'
const NAVY = '#0B1228'
const MUTED = '#5B6172'
const SOFT_BG = '#F4F2FE'
const BORDER = '#E6E3F7'
const PURPLE_TINT = '#EFEBFE'
const BLUE_TINT = '#E3EEFE'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: 0,
  backgroundColor: '#ffffff',
}

/* Hero gradient band */
const heroBand: React.CSSProperties = {
  background: `linear-gradient(120deg, ${BLUE} 0%, ${PURPLE} 60%, ${PINK_HINT} 100%)`,
  padding: '18px 24px 60px',
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
}

const browserText: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.85)',
  margin: 0,
}

const browserLink: React.CSSProperties = {
  color: '#ffffff',
  textDecoration: 'underline',
  fontWeight: 600,
}

const logoImg: React.CSSProperties = {
  display: 'block',
  margin: '0 auto 6px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.15)',
  padding: '4px',
}

const brandName: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#ffffff',
  margin: '4px 0 0',
  letterSpacing: '0.5px',
  textAlign: 'center',
}

const brandSub: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '4px',
  color: 'rgba(255,255,255,0.85)',
  margin: '2px 0 0',
  textAlign: 'center',
  fontWeight: 600,
}

/* Wave area + hex icon */
const waveSection: React.CSSProperties = {
  position: 'relative',
  marginTop: '-30px',
}

const waveTop: React.CSSProperties = {
  height: '40px',
  background: '#ffffff',
  borderTopLeftRadius: '50% 100%',
  borderTopRightRadius: '50% 100%',
}

const hexImg: React.CSSProperties = {
  display: 'inline-block',
  margin: '0 auto',
  filter: 'drop-shadow(0 12px 24px rgba(110,86,248,0.35))',
}

/* Title */
const h1: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: INK,
  margin: '12px 0 8px',
  textAlign: 'center',
  letterSpacing: '-0.4px',
  lineHeight: '1.2',
}

const h1Accent: React.CSSProperties = {
  background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: PURPLE,
}

const subText: React.CSSProperties = {
  fontSize: '14px',
  color: MUTED,
  lineHeight: '1.6',
  margin: '8px auto 0',
  textAlign: 'center',
  maxWidth: '440px',
}

const accentDivider: React.CSSProperties = {
  width: '60px',
  height: '3px',
  background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})`,
  margin: '14px auto 0',
  borderRadius: '2px',
}

/* Account update card */
const detailsCard: React.CSSProperties = {
  margin: '20px 24px 18px',
  padding: '18px 18px 16px',
  border: `1px solid ${BORDER}`,
  borderRadius: '14px',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
}

const detailsHeader: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 14px',
}

const detailsDash: React.CSSProperties = {
  color: PURPLE,
  fontWeight: 700,
  fontSize: '14px',
  margin: '0 6px',
}

const detailsHeaderText: React.CSSProperties = {
  color: PURPLE,
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '2px',
}

const emailIconCircleCurrent: React.CSSProperties = {
  width: '48px',
  height: '48px',
  lineHeight: '48px',
  borderRadius: '50%',
  backgroundColor: PURPLE_TINT,
  textAlign: 'center',
  display: 'inline-block',
}

const emailIconCircleNew: React.CSSProperties = {
  width: '48px',
  height: '48px',
  lineHeight: '48px',
  borderRadius: '50%',
  backgroundColor: BLUE_TINT,
  textAlign: 'center',
  display: 'inline-block',
}

const emailIconEmoji: React.CSSProperties = {
  fontSize: '20px',
  margin: 0,
  lineHeight: '48px',
  color: PURPLE,
  fontWeight: 700,
}

const emailLabel: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '0 0 2px',
  fontWeight: 500,
}

const emailValue: React.CSSProperties = {
  fontSize: '15px',
  color: INK,
  margin: 0,
  fontWeight: 700,
  wordBreak: 'break-all',
}

const emailValueNew: React.CSSProperties = {
  fontSize: '15px',
  color: INK,
  margin: 0,
  fontWeight: 700,
  wordBreak: 'break-all',
}

const connectorLineWrap: React.CSSProperties = {
  paddingLeft: '24px',
  margin: '4px 0',
}

const connectorLine: React.CSSProperties = {
  width: '2px',
  height: '20px',
  background: `linear-gradient(180deg, ${PURPLE}, ${BLUE})`,
  marginLeft: '12px',
}

/* Pill CTA */
const button: React.CSSProperties = {
  background: `linear-gradient(90deg, ${BLUE} 0%, ${PURPLE} 60%, ${PINK_HINT} 100%)`,
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '1px',
  borderRadius: '999px',
  padding: '14px 26px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 12px 28px rgba(110,86,248,0.42)',
}

const buttonLockIcon: React.CSSProperties = {
  marginRight: '10px',
  fontSize: '14px',
}

const buttonLabel: React.CSSProperties = {
  verticalAlign: 'middle',
}

const buttonArrow: React.CSSProperties = {
  marginLeft: '12px',
  fontSize: '15px',
}

/* Security card (dark) */
const securityCard: React.CSSProperties = {
  margin: '22px 24px 14px',
  padding: '18px 18px',
  borderRadius: '14px',
  background: `linear-gradient(135deg, ${NAVY} 0%, #1A1F45 100%)`,
  boxShadow: '0 8px 24px rgba(11,18,40,0.25)',
}

const securityTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#ffffff',
  margin: '0 0 6px',
}

const securityText: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.78)',
  margin: 0,
  lineHeight: '1.55',
}

const securityLink: React.CSSProperties = {
  color: BLUE,
  fontWeight: 700,
  textDecoration: 'underline',
}

/* Help card (light) */
const helpCard: React.CSSProperties = {
  margin: '0 24px 14px',
  padding: '18px',
  borderRadius: '14px',
  backgroundColor: SOFT_BG,
  border: `1px solid ${BORDER}`,
}

const helpTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: PURPLE,
  margin: '0 0 6px',
}

const helpText: React.CSSProperties = {
  fontSize: '13px',
  color: MUTED,
  margin: 0,
  lineHeight: '1.55',
}

const contactPill: React.CSSProperties = {
  display: 'block',
  backgroundColor: '#ffffff',
  borderRadius: '999px',
  padding: '10px 12px',
  textDecoration: 'none',
  border: `1px solid ${BORDER}`,
  fontSize: '11.5px',
  color: INK,
  textAlign: 'center',
  fontWeight: 600,
}

const contactPillIcon: React.CSSProperties = {
  marginRight: '6px',
  color: PURPLE,
}

const contactPillText: React.CSSProperties = {
  color: INK,
  wordBreak: 'break-all',
}

/* Sign-off */
const shieldDot: React.CSSProperties = {
  display: 'inline-block',
  width: '36px',
  height: '36px',
  lineHeight: '36px',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})`,
  textAlign: 'center',
  margin: '0 auto 8px',
}

const shieldEmoji: React.CSSProperties = {
  fontSize: '16px',
  color: '#ffffff',
  margin: 0,
  lineHeight: '36px',
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

const shieldInline: React.CSSProperties = {
  color: PURPLE,
}

/* Footer gradient band */
const footerBand: React.CSSProperties = {
  background: `linear-gradient(90deg, ${BLUE} 0%, ${PURPLE} 60%, ${PINK_HINT} 100%)`,
  padding: '18px 24px',
  borderBottomLeftRadius: '16px',
  borderBottomRightRadius: '16px',
  marginTop: '14px',
}

const socialIcon: React.CSSProperties = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  lineHeight: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  textAlign: 'center',
  textDecoration: 'none',
  margin: '0 6px',
  border: '1.5px solid rgba(255,255,255,0.6)',
}
