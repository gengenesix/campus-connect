import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview,
} from '@react-email/components'

interface Props {
  recipientName: string
  senderName: string
  messagePreview: string
  listingTitle?: string
  replyUrl: string
}

export default function NewMessageEmail({
  recipientName,
  senderName,
  messagePreview,
  listingTitle,
  replyUrl,
}: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{senderName} sent you a message on Campus Connect</Preview>
      <Body style={{ background: '#f5f5f5', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', background: '#fff', border: '2px solid #111', boxShadow: '6px 6px 0 #111' }}>

          {/* Header */}
          <Section style={{ background: '#5d3fd3', padding: '28px 32px' }}>
            <Heading style={{ color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '22px', margin: 0, letterSpacing: '-0.5px' }}>
              CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: '4px 0 0', letterSpacing: '2px' }}>
              NEW MESSAGE
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px' }}>
            <Heading style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '24px', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              {senderName.toUpperCase()} SENT YOU A MESSAGE
            </Heading>
            <Text style={{ fontSize: '15px', color: '#666', margin: '0 0 20px' }}>
              Hey {recipientName},
            </Text>

            {/* Message bubble */}
            <Section style={{ background: '#f0ecff', border: '2px solid #5d3fd3', padding: '16px 20px', margin: '0 0 24px', borderLeft: '4px solid #5d3fd3' }}>
              {listingTitle && (
                <Text style={{ fontSize: '11px', color: '#888', fontFamily: 'Arial Black, sans-serif', margin: '0 0 8px', letterSpacing: '0.5px' }}>
                  RE: {listingTitle.toUpperCase()}
                </Text>
              )}
              <Text style={{ fontSize: '15px', color: '#111', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
                &ldquo;{messagePreview}&rdquo;
              </Text>
              <Text style={{ fontSize: '11px', color: '#888', margin: '8px 0 0' }}>
                — {senderName}
              </Text>
            </Section>

            <Link
              href={replyUrl}
              style={{ display: 'inline-block', background: '#5d3fd3', color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '13px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.5px', border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}
            >
              REPLY NOW →
            </Link>
          </Section>

          <Hr style={{ border: 'none', borderTop: '2px solid #111', margin: 0 }} />

          {/* Footer */}
          <Section style={{ padding: '20px 32px', background: '#f8f8f8' }}>
            <Text style={{ fontSize: '11px', color: '#999', margin: 0 }}>
              You received this because someone messaged you on Campus Connect. To manage email notifications, visit your profile settings.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
