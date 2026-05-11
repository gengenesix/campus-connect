import {
  Body, Container, Head, Heading, Html,
  Link, Preview, Section, Text,
} from '@react-email/components'

interface Props {
  clientName: string
  providerName: string
  serviceName: string
  serviceRate?: string
  notes?: string
  scheduledAt?: string
  bookingUrl: string
}

export default function BookingConfirmedEmail({
  clientName,
  providerName,
  serviceName,
  serviceRate,
  notes,
  scheduledAt,
  bookingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your booking for {serviceName} has been confirmed!</Preview>
      <Body style={{ background: '#f8f8f8', fontFamily: '"Space Grotesk", Helvetica, sans-serif', margin: 0, padding: '40px 0' }}>
        <Container style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ background: '#1B5E20', padding: '32px 40px', border: '3px solid #111' }}>
            <Text style={{ color: '#86efac', margin: '0 0 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '3px' }}>
              ✓ BOOKING CONFIRMED
            </Text>
            <Heading style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              {serviceName}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ background: '#fff', padding: '36px 40px', border: '3px solid #111', borderTop: 'none' }}>
            <Text style={{ fontSize: '16px', color: '#444', margin: '0 0 24px' }}>
              Hi <strong>{clientName}</strong>,
            </Text>
            <Text style={{ fontSize: '15px', color: '#111', margin: '0 0 24px', lineHeight: '1.6' }}>
              Great news — <strong>{providerName}</strong> has confirmed your booking. Get in touch to arrange the details.
            </Text>

            {/* Details card */}
            <Section style={{ background: '#e8f5e9', border: '2px solid #1B5E20', padding: '20px 24px', marginBottom: '24px' }}>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: '12px', color: '#1B5E20', paddingBottom: '10px', fontWeight: 700, width: '40%' }}>SERVICE</td>
                    <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{serviceName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: '12px', color: '#1B5E20', paddingBottom: '10px', fontWeight: 700 }}>PROVIDER</td>
                    <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{providerName}</td>
                  </tr>
                  {serviceRate && (
                    <tr>
                      <td style={{ fontSize: '12px', color: '#1B5E20', paddingBottom: '10px', fontWeight: 700 }}>RATE</td>
                      <td style={{ fontSize: '14px', fontWeight: 700, color: '#1B5E20', paddingBottom: '10px' }}>{serviceRate}</td>
                    </tr>
                  )}
                  {scheduledAt && (
                    <tr>
                      <td style={{ fontSize: '12px', color: '#1B5E20', paddingBottom: '10px', fontWeight: 700 }}>SCHEDULED</td>
                      <td style={{ fontSize: '14px', fontWeight: 700, color: '#111', paddingBottom: '10px' }}>{scheduledAt}</td>
                    </tr>
                  )}
                  {notes && (
                    <tr>
                      <td style={{ fontSize: '12px', color: '#1B5E20', paddingBottom: '0', fontWeight: 700 }}>YOUR NOTES</td>
                      <td style={{ fontSize: '14px', color: '#444', paddingBottom: '0', fontStyle: 'italic' }}>"{notes}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* CTA */}
            <Link
              href={bookingUrl}
              style={{
                display: 'block', textAlign: 'center', padding: '16px 32px',
                background: '#1B5E20', color: '#fff',
                fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px',
                textDecoration: 'none', border: '2px solid #111',
                boxShadow: '4px 4px 0 #111',
              }}
            >
              VIEW BOOKING →
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
