/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MUFFIGOUT APPAREL HUB'

interface StaffInviteProps {
  inviteUrl?: string
  invitedBy?: string
  displayName?: string
  expiresAt?: string
}

const StaffInviteEmail = ({
  inviteUrl = 'https://muffigoutapparelhub.com',
  invitedBy = 'The Muffigout team',
  displayName,
  expiresAt,
}: StaffInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {SITE_NAME}'s admin team</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {displayName ? `Hey ${displayName},` : 'You\u2019re invited!'}
        </Heading>
        <Text style={text}>
          {invitedBy} has invited you to join the <strong>{SITE_NAME}</strong> admin
          team. You'll be able to help manage products, orders, and other parts of
          the store based on the permissions assigned to you.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button style={button} href={inviteUrl}>
            Accept invite & set password
          </Button>
        </Section>
        <Text style={text}>
          Click the button above to create your account. You'll set your own
          password — only you will know it.
        </Text>
        {expiresAt && (
          <Text style={hint}>
            This invite expires on {new Date(expiresAt).toLocaleString('en-IN')}.
          </Text>
        )}
        <Text style={footer}>
          If you weren't expecting this, you can safely ignore this email.
        </Text>
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

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0f172a',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const button = {
  backgroundColor: '#7C3AED',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  borderRadius: '999px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hint = { fontSize: '12px', color: '#64748b', margin: '16px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }
