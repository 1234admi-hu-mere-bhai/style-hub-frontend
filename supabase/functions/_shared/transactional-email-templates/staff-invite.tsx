/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'
const LOGO_URL = 'https://www.muffigoutapparelhub.com/assets/logo-new.png'
const BADGE_URL =
  'https://zybjzfffkylezzvotcnn.supabase.co/storage/v1/object/public/email-assets/staff-badge.jpg'
const SUPPORT_EMAIL = 'support@muffigoutapparelhub.com'
const SITE_URL = 'https://muffigoutapparelhub.com'

interface StaffInviteProps {
  inviteUrl?: string
  invitedBy?: string
  displayName?: string
  expiresAt?: string
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

const StaffInviteEmail = ({
  inviteUrl = SITE_URL,
  displayName,
  expiresAt,
}: StaffInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {SITE_NAME}'s admin team</Preview>
    <Body style={main}>
      <Container style={outerContainer}>

        {/* ===== HEADER BAND ===== */}
        <Section style={headerBand}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ borderCollapse: 'collapse' }}>
            <tr>
              <td align="left" style={{ verticalAlign: 'middle' }}>
                <table cellPadding={0} cellSpacing={0} role="presentation"><tr>
                  <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>
                    <Img src={LOGO_URL} width="40" height="40" alt={SITE_NAME} style={{ borderRadius: '50%', display: 'block' }} />
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <Text style={brandText}>MUFFI GOUT</Text>
                    <Text style={brandSubText}>— APPAREL HUB —</Text>
                  </td>
                </tr></table>
              </td>
              <td align="right" style={{ verticalAlign: 'middle' }}>
                <Text style={trustBadge}>🛡 Private · Secure · Trusted</Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* ===== HERO ===== */}
        <Section style={heroSection}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ borderCollapse: 'collapse' }}>
            <tr>
              <td style={heroLeftCell}>
                <Heading style={heroH1}>YOU'VE BEEN</Heading>
                <Heading style={heroH1Accent}>INVITED!</Heading>
                <div style={accentLine} />
                <Text style={heroBody}>
                  Hello{displayName ? ` ${displayName}` : ''},<br />
                  You have been personally invited to join the{' '}
                  <strong style={{ color: '#1a1033' }}>{SITE_NAME}</strong> admin panel.
                </Text>

                <table cellPadding={0} cellSpacing={0} role="presentation" style={secureCard}>
                  <tr>
                    <td style={{ verticalAlign: 'top', paddingRight: '12px', width: '48px' }}>
                      <div style={secureIconCircle}>🛡</div>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <Text style={secureCardText}>
                        This invitation grants you{' '}
                        <span style={{ color: '#7C3AED', fontWeight: 700 }}>secure access</span>{' '}
                        to our private staff dashboard and resources.
                      </Text>
                    </td>
                  </tr>
                </table>
              </td>
              <td style={heroRightCell} align="center">
                <Img
                  src={BADGE_URL}
                  width="220"
                  height="220"
                  alt="Staff Access Badge"
                  style={{ display: 'block', margin: '0 auto', borderRadius: '12px', maxWidth: '100%', height: 'auto' }}
                />
              </td>
            </tr>
          </table>
        </Section>

        {/* ===== INVITATION DETAILS ===== */}
        <Section style={detailsWrap}>
          <Text style={detailsTitle}>· · ·  INVITATION DETAILS  · · ·</Text>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={detailsCard}>
            <tr>
              <td align="center" style={detailsCell}>
                <div style={detailsIconCircle}>🏢</div>
                <Text style={detailsLabel}>Organization</Text>
                <Text style={detailsValue}>Muffi Gout Apparel Hub</Text>
              </td>
              <td style={detailsDivider}></td>
              <td align="center" style={detailsCell}>
                <div style={detailsIconCircle}>👥</div>
                <Text style={detailsLabel}>Access Level</Text>
                <Text style={detailsValue}>Staff Access</Text>
              </td>
              <td style={detailsDivider}></td>
              <td align="center" style={detailsCell}>
                <div style={detailsIconCircle}>📅</div>
                <Text style={detailsLabel}>Invitation Expires</Text>
                <Text style={detailsValue}>{formatDate(expiresAt)}</Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* ===== CTA ===== */}
        <Section style={{ textAlign: 'center', padding: '8px 24px 32px' }}>
          <Button style={ctaButton} href={inviteUrl}>
            🔒  ACCEPT INVITATION  →
          </Button>
          <Text style={ctaHint}>
            The link above is unique to you and expires on the date mentioned.
          </Text>
        </Section>

        {/* ===== SECURITY WARNING BAND ===== */}
        <Section style={warningBand}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td style={{ verticalAlign: 'top', width: '64px', paddingRight: '12px' }}>
                <div style={warningIcon}>⚠</div>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <Text style={warningHeading}>
                  STRICT SECURITY <span style={{ color: '#FCA5A5' }}>WARNING</span>
                </Text>
                <Text style={warningSubheading}>
                  THIS INVITATION IS CONFIDENTIAL AND INTENDED ONLY FOR YOU.
                </Text>
                <Text style={warningItem}>
                  <span style={warningX}>✕</span> Do <strong style={warningStrong}>NOT</strong> share this invitation link with anyone.
                </Text>
                <Text style={warningItem}>
                  <span style={warningX}>✕</span> Do <strong style={warningStrong}>NOT</strong> share your login credentials with anyone.
                </Text>
                <Text style={warningItem}>
                  <span style={warningX}>✕</span> Do <strong style={warningStrong}>NOT</strong> forward this email.
                </Text>
                <Text style={warningItem}>
                  <span style={warningX}>✕</span> Any unauthorized access or sharing may result in immediate revocation of access and disciplinary action.
                </Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* ===== HELP CARD ===== */}
        <Section style={{ padding: '24px' }}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={helpCard}>
            <tr>
              <td style={helpLeftCell}>
                <table cellPadding={0} cellSpacing={0} role="presentation"><tr>
                  <td style={{ verticalAlign: 'top', width: '52px', paddingRight: '12px' }}>
                    <div style={helpIconCircle}>🎧</div>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <Text style={helpTitle}>Need Help?</Text>
                    <Text style={helpBody}>
                      If you have any questions or need assistance, our support team is here to help.
                    </Text>
                  </td>
                </tr></table>
              </td>
              <td style={helpDivider}></td>
              <td style={helpRightCell}>
                <Text style={helpContactLine}>
                  <span style={helpContactIcon}>✉</span>{' '}
                  <Link href={`mailto:${SUPPORT_EMAIL}`} style={helpContactLink}>{SUPPORT_EMAIL}</Link>
                </Text>
                <Text style={helpContactLine}>
                  <span style={helpContactIcon}>🌐</span>{' '}
                  <Link href={SITE_URL} style={helpContactLink}>www.muffigoutapparelhub.com</Link>
                </Text>
              </td>
            </tr>
          </table>
        </Section>

        {/* ===== SIGN-OFF ===== */}
        <Section style={{ textAlign: 'center', padding: '8px 24px 24px' }}>
          <Text style={signoffScript}>Thanks &amp; Best Regards,</Text>
          <Text style={signoffName}>The {SITE_NAME} Team</Text>
          <Text style={signoffTagline}>
            <span style={{ color: '#7C3AED' }}>🛡</span> Your security is our top priority.
          </Text>
        </Section>

        {/* ===== FOOTER BAND ===== */}
        <Section style={footerBand}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="left" style={{ verticalAlign: 'middle' }}>
                <Img src={LOGO_URL} width="32" height="32" alt={SITE_NAME} style={{ borderRadius: '50%', display: 'block' }} />
              </td>
              <td align="center" style={{ verticalAlign: 'middle' }}>
                <Text style={footerText}>This is an automated email. Please do not reply to this message.</Text>
              </td>
              <td align="right" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Link href="https://www.instagram.com/muffigoutapparelhub" style={socialLink}>IG</Link>
                <Link href="https://www.facebook.com/muffigoutapparelhub" style={socialLink}>FB</Link>
              </td>
            </tr>
          </table>
        </Section>

      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StaffInviteEmail,
  subject: `You've been invited to ${SITE_NAME}'s admin team`,
  displayName: 'Staff invite',
  previewData: {
    inviteUrl: 'https://muffigoutapparelhub.com/staff-invite/sample-token',
    invitedBy: 'Muffigout Owner',
    displayName: 'Aisha',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
} satisfies TemplateEntry

/* ===================== STYLES ===================== */

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }
const outerContainer = { backgroundColor: '#ffffff', maxWidth: '640px', margin: '0 auto', padding: 0 }

/* Header band */
const headerBand = {
  background: 'linear-gradient(135deg, #1a1033 0%, #2d1b5e 100%)',
  padding: '20px 28px',
  borderRadius: '0 0 24px 24px',
}
const brandText = { color: '#ffffff', fontSize: '20px', fontWeight: 800 as const, letterSpacing: '1px', margin: 0, lineHeight: 1.1 }
const brandSubText = { color: '#9F86FF', fontSize: '10px', letterSpacing: '3px', margin: '2px 0 0', fontWeight: 600 as const }
const trustBadge = { color: '#ffffff', fontSize: '12px', margin: 0, fontWeight: 600 as const }

/* Hero */
const heroSection = { padding: '32px 28px 8px' }
const heroLeftCell = { verticalAlign: 'top' as const, width: '60%', paddingRight: '16px' }
const heroRightCell = { verticalAlign: 'middle' as const, width: '40%' }
const heroH1 = { fontSize: '34px', fontWeight: 900 as const, color: '#0f0a1f', margin: 0, lineHeight: 1.05, letterSpacing: '-0.5px' }
const heroH1Accent = {
  fontSize: '34px', fontWeight: 900 as const, margin: '0 0 4px',
  background: 'linear-gradient(135deg, #7C3AED 0%, #14B8A6 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', color: '#7C3AED', lineHeight: 1.05, letterSpacing: '-0.5px',
}
const accentLine = { width: '48px', height: '3px', background: 'linear-gradient(90deg, #7C3AED, #14B8A6)', borderRadius: '999px', margin: '8px 0 16px' }
const heroBody = { fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }

const secureCard = {
  background: '#F8F5FF',
  border: '1px solid #E9E3FF',
  borderRadius: '12px',
  padding: '14px',
  width: '100%',
  borderCollapse: 'separate' as const,
}
const secureIconCircle = {
  width: '40px', height: '40px', borderRadius: '50%',
  background: 'linear-gradient(135deg, #1a1033, #2d1b5e)',
  color: '#A78BFA', textAlign: 'center' as const, lineHeight: '40px',
  fontSize: '18px',
}
const secureCardText = { fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }

/* Details */
const detailsWrap = { padding: '24px 28px 8px', textAlign: 'center' as const }
const detailsTitle = { fontSize: '12px', fontWeight: 800 as const, letterSpacing: '3px', color: '#1a1033', margin: '0 0 12px' }
const detailsCard = {
  background: '#ffffff',
  border: '1px solid #E9E3FF',
  borderRadius: '14px',
  padding: '18px 8px',
  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.08)',
  borderCollapse: 'separate' as const,
}
const detailsCell = { width: '32%', padding: '8px 4px', verticalAlign: 'top' as const }
const detailsDivider = { width: '1px', background: '#E9E3FF', padding: 0 }
const detailsIconCircle = {
  width: '40px', height: '40px', borderRadius: '50%',
  background: 'linear-gradient(135deg, #F8F5FF, #ECFDFA)',
  color: '#7C3AED', margin: '0 auto 8px',
  fontSize: '18px', lineHeight: '40px', textAlign: 'center' as const,
  border: '1px solid #E9E3FF',
}
const detailsLabel = { fontSize: '12px', fontWeight: 700 as const, color: '#1a1033', margin: '0 0 2px' }
const detailsValue = { fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }

/* CTA */
const ctaButton = {
  background: 'linear-gradient(135deg, #1a1033 0%, #2d1b5e 100%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  letterSpacing: '0.5px',
  borderRadius: '999px',
  padding: '16px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  border: '2px solid #7C3AED',
  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
}
const ctaHint = { fontSize: '12px', color: '#64748b', margin: '14px 0 0' }

/* Warning band */
const warningBand = {
  background: 'linear-gradient(135deg, #2a0a1a 0%, #4a1124 100%)',
  padding: '24px 28px',
  borderTop: '4px solid #DC2626',
  borderBottom: '4px solid #DC2626',
  margin: '8px 0',
}
const warningIcon = {
  width: '52px', height: '52px',
  border: '2px solid #F87171',
  borderRadius: '8px',
  color: '#F87171',
  textAlign: 'center' as const,
  lineHeight: '48px',
  fontSize: '28px',
  fontWeight: 900 as const,
}
const warningHeading = { fontSize: '17px', fontWeight: 800 as const, color: '#ffffff', margin: '0 0 6px', letterSpacing: '0.5px' }
const warningSubheading = { fontSize: '11px', fontWeight: 700 as const, color: '#FCA5A5', margin: '0 0 12px', letterSpacing: '0.5px' }
const warningItem = { fontSize: '12px', color: '#FECACA', margin: '0 0 6px', lineHeight: 1.5 }
const warningX = { color: '#F87171', fontWeight: 800 as const, marginRight: '6px' }
const warningStrong = { color: '#FCA5A5', fontWeight: 800 as const }

/* Help card */
const helpCard = {
  background: '#F8F5FF',
  border: '1px solid #E9E3FF',
  borderRadius: '14px',
  padding: '16px',
  borderCollapse: 'separate' as const,
}
const helpLeftCell = { verticalAlign: 'top' as const, width: '55%', paddingRight: '12px' }
const helpRightCell = { verticalAlign: 'middle' as const, width: '40%', paddingLeft: '12px' }
const helpDivider = { width: '1px', background: '#E9E3FF', padding: 0 }
const helpIconCircle = {
  width: '40px', height: '40px', borderRadius: '50%',
  background: '#ECFDFA',
  color: '#0F766E',
  textAlign: 'center' as const, lineHeight: '40px', fontSize: '18px',
  border: '1px solid #CCFBF1',
}
const helpTitle = { fontSize: '13px', fontWeight: 700 as const, color: '#0F766E', margin: '0 0 4px', borderBottom: '2px solid #14B8A6', display: 'inline-block', paddingBottom: '2px' }
const helpBody = { fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.5 }
const helpContactLine = { fontSize: '13px', color: '#1a1033', margin: '0 0 6px', lineHeight: 1.5 }
const helpContactIcon = { color: '#7C3AED', marginRight: '6px' }
const helpContactLink = { color: '#1a1033', textDecoration: 'none', fontWeight: 600 as const }

/* Sign-off */
const signoffScript = { fontSize: '16px', fontStyle: 'italic' as const, color: '#7C3AED', margin: '0 0 4px', fontFamily: "'Brush Script MT', cursive" }
const signoffName = { fontSize: '15px', fontWeight: 700 as const, color: '#1a1033', margin: '0 0 8px' }
const signoffTagline = { fontSize: '12px', color: '#64748b', margin: 0 }

/* Footer band */
const footerBand = {
  background: 'linear-gradient(135deg, #1a1033 0%, #2d1b5e 100%)',
  padding: '16px 24px',
  borderRadius: '24px 24px 0 0',
}
const footerText = { color: '#ffffff', fontSize: '11px', margin: 0 }
const socialLink = {
  display: 'inline-block',
  width: '28px', height: '28px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  fontSize: '11px', fontWeight: 700 as const,
  textAlign: 'center' as const, lineHeight: '28px',
  textDecoration: 'none',
  marginLeft: '6px',
}
