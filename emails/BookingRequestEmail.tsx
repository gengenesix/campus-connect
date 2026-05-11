import {
  Body, Container, Head, Heading, Hr, Html, Img,
  Link, Preview, Section, Text,
} from '@react-email/components'

interface Props {
  providerName: string
  clientName: string
  serviceName: string
  serviceRate?: string
  notes?: string
  scheduledAt?: string
  bookingUrl: string
}

export default function BookingRequestEmail({
  providerName,
  clientName,
  serviceName,
  serviceRate,
  notes,
  scheduledAt,
  bookingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{clientName} wants to book your service: {serviceName}</Preview>
      <Body style={{ background: '#f8f8f8', fontFamily: '"Space Grotesk", Helvetica, sans-serif', margin: 0, padding: '40px 0' }}>
        <Container style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ background: '#5d3fd3', padding: '32px 40px', border: '3px solid #111' }}>
            <Heading style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              NEW BOOKING REQUEST
            </Heading>
            <Text style={{ color: '#c4b5fd', margin: '8px 0 0', fontSize: '14px', letterSpacing: '1px' }}>
              CAMPUS CONNECT · SERVICES
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ background: '#fff', padding: '36px 40px', border: '3px solid #111', borderTop: 'none' }}>
            <Text style={{ fontSize: '16px', color: '#444', margin: '0 0 24px' }}>
              Hi <strong>{providerName}</strong>,
            </Text>
            <Text style={{ fontSize: '15px', color: '#111', margin: '0 0 24px', lineHeight: '1.6' }}>
              A student wants to book your service. Review their request and confirm when ready.
            </Text>

            {/* Booking details card */}
            <Section style={{ background: '#f8f8f8', border: '2px solid #111', padding: '20px 24px', marginBottom: '24px' }}>
              <Text style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#888', margin: '0 0 16px', textTransform: 'uppercase' }}>
                BOOKING DETAILS
              </Text>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: '12px', color: '#888', paddingBottom: '10px', width: '40%' }}>SERVICE</td>
                    <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{serviceName}</td>
                  </tr>
                  {serviceRate && (
                    <tr>
                      <td style={{ fontSize: '12px', color: '#888', paddingBottom: '10px' }}>RATE</td>
                      <td style={{ fontSize: '14px', fontWeight: 700, color: '#5d3fd3', paddingBottom: '10px' }}>{serviceRate}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontSize: '12px', color: '#888', paddingBottom: '10px' }}>CLIENT</td>
                    <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{clientName}</td>
                  </tr>
                  {scheduledAt && (
                    <tr>
                      <td style={{ fontSize: '12px', color: '#888', paddingBottom: '10px' }}>REQUESTED DATE</td>
                      <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{scheduledAt}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {notes && (
                <>
                  <Hr style={{ borderColor: '#eee', margin: '12px 0' }} />
                  <Text style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', fontWeight: 700, letterSpacing: '1px' }}>NOTES FROM CLIENT</Text>
                  <Text style={{ fontSize: '14px', color: '#444', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
                    "{notes}"
                  </Text>
                </>
              )}
            </Section>

            {/* CTA */}
            <Link
              href={bookingUrl}
              style={{
                display: 'block', textAlign: 'center', padding: '16px 32px',
                background: '#5d3fd3', color: '#fff',
                fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px',
                textDecoration: 'none', border: '2px solid #111',
                boxShadow: '4px 4px 0 #111',
              }}
            >
              REVIEW & CONFIRM BOOKING →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '20px 40px', textAlign: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
              Campus Connect · Ghana&apos;s Student Marketplace
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
