import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview, Img,
} from '@react-email/components'

interface Props {
  sellerName: string
  listingTitle: string
  listingType: 'product' | 'service'
  listingUrl: string
  imageUrl?: string | null
}

export default function ListingApprovedEmail({
  sellerName,
  listingTitle,
  listingType,
  listingUrl,
  imageUrl,
}: Props) {
  const isProduct = listingType === 'product'

  return (
    <Html lang="en">
      <Head />
      <Preview>Your listing &quot;{listingTitle}&quot; is now live on Campus Connect</Preview>
      <Body style={{ background: '#f5f5f5', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', background: '#fff', border: '2px solid #111', boxShadow: '6px 6px 0 #111' }}>

          {/* Header */}
          <Section style={{ background: '#1B5E20', padding: '28px 32px' }}>
            <Heading style={{ color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '22px', margin: 0, letterSpacing: '-0.5px' }}>
              CAMPUS<span style={{ color: '#a78bfa' }}>.</span>CONNECT
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: '4px 0 0', letterSpacing: '2px' }}>
              YOUR LISTING IS LIVE
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px' }}>
            <Text style={{ display: 'inline-block', background: '#ccff00', color: '#111', fontFamily: 'Arial Black, sans-serif', fontSize: '11px', padding: '4px 12px', letterSpacing: '1px', border: '1px solid #111', marginBottom: '20px' }}>
              ✓ APPROVED
            </Text>
            <Heading style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '26px', color: '#111', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
              YOUR {isProduct ? 'LISTING' : 'SERVICE'} IS NOW LIVE
            </Heading>
            <Text style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 8px' }}>
              Hey {sellerName}, your {isProduct ? 'listing' : 'service'} has been approved and is now visible to students across Campus Connect.
            </Text>

            {/* Listing preview */}
            <Section style={{ background: '#f8f8f8', border: '2px solid #111', padding: '16px', margin: '20px 0', display: 'flex', gap: '12px' }}>
              {imageUrl && (
                <Img src={imageUrl} alt={listingTitle} width={64} height={64} style={{ objectFit: 'cover', border: '1px solid #ddd', flexShrink: 0 }} />
              )}
              <div>
                <Text style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '15px', color: '#111', margin: '0 0 4px' }}>
                  {listingTitle}
                </Text>
                <Text style={{ fontSize: '12px', color: '#888', margin: 0, letterSpacing: '0.5px' }}>
                  {isProduct ? 'GOODS LISTING' : 'SERVICE LISTING'}
                </Text>
              </div>
            </Section>

            <Link
              href={listingUrl}
              style={{ display: 'inline-block', background: '#111', color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '13px', padding: '14px 28px', textDecoration: 'none', letterSpacing: '0.5px', border: '2px solid #111', boxShadow: '3px 3px 0 #1B5E20' }}
            >
              VIEW YOUR LISTING →
            </Link>
          </Section>

          <Hr style={{ border: 'none', borderTop: '2px solid #111', margin: 0 }} />

          {/* Tips */}
          <Section style={{ padding: '24px 32px', background: '#f8f8f8' }}>
            <Text style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#888', letterSpacing: '1.5px', margin: '0 0 12px' }}>
              TIPS FOR MORE VIEWS
            </Text>
            {[
              '📸 Add clear, well-lit photos for 3× more messages',
              '💬 Respond quickly to build your campus reputation',
              '📲 Share your listing link in your class WhatsApp groups',
            ].map((tip, i) => (
              <Text key={i} style={{ fontSize: '13px', color: '#444', margin: '6px 0', lineHeight: '1.5' }}>
                {tip}
              </Text>
            ))}
          </Section>

          {/* Footer */}
          <Section style={{ padding: '20px 32px', borderTop: '2px solid #111' }}>
            <Text style={{ fontSize: '11px', color: '#999', margin: 0 }}>
              Campus Connect · Ghana&apos;s Student Marketplace · 100% Free
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
