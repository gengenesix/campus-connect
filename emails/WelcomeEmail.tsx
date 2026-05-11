import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview,
} from '@react-email/components'

interface Props {
  name: string
  loginUrl?: string
}

export default function WelcomeEmail({ name, loginUrl = 'https://campusconnect.gh/auth/login' }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Campus Connect — Ghana&apos;s student marketplace</Preview>
      <Body style={{ background: '#f5f5f5', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', background: '#fff', border: '2px solid #111', boxShadow: '6px 6px 0 #111' }}>

          {/* Header */}
          <Section style={{ background: '#111', padding: '28px 32px' }}>
            <Heading style={{ color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '22px', margin: 0, letterSpacing: '-0.5px' }}>
              CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
            </Heading>
            <Text style={{ color: '#888', fontSize: '11px', margin: '4px 0 0', letterSpacing: '2px' }}>
              GHANA&apos;S STUDENT MARKETPLACE
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px' }}>
            <Heading style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '28px', color: '#111', margin: '0 0 16px', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
              WELCOME,<br />{name.toUpperCase()}
            </Heading>
            <Text style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 20px' }}>
              You&apos;re now part of Campus Connect — the free peer-to-peer marketplace connecting students across all 43 universities in Ghana.
            </Text>
            <Text style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 28px' }}>
              Buy textbooks, sell equipment, book campus services, and connect with fellow students — all in one place.
            </Text>

            <Link
              href={loginUrl}
              style={{ display: 'inline-block', background: '#1B5E20', color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '13px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.5px', border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}
            >
              BROWSE CAMPUS CONNECT →
            </Link>
          </Section>

          <Hr style={{ border: 'none', borderTop: '2px solid #111', margin: 0 }} />

          {/* Tips */}
          <Section style={{ padding: '24px 32px', background: '#f8f8f8' }}>
            <Text style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#888', letterSpacing: '1.5px', margin: '0 0 12px' }}>
              GET STARTED
            </Text>
            {[
              '📦 List your first item — it takes 2 minutes',
              '🔍 Browse goods and services from your campus',
              '💬 Message sellers directly through the platform',
            ].map((tip, i) => (
              <Text key={i} style={{ fontSize: '13px', color: '#444', margin: '6px 0', lineHeight: '1.5' }}>
                {tip}
              </Text>
            ))}
          </Section>

          {/* Footer */}
          <Section style={{ padding: '20px 32px', borderTop: '2px solid #111' }}>
            <Text style={{ fontSize: '11px', color: '#999', margin: 0, lineHeight: '1.5' }}>
              You received this because you signed up at campusconnect.gh. Questions? Reply to this email.
              <br />100% free · No commission · Ghana-wide
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
