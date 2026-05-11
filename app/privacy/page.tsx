import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Campus Connect',
  description: 'How Campus Connect collects, uses, and protects your personal data across Ghana\'s university marketplace.',
}

export default function PrivacyPage() {
  return (
    <main style={{ background: '#f8f8f8', minHeight: '80vh' }}>
      {/* Header strip */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: '#a78bfa' }}>Privacy Policy</span>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 20px' }}>
        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '52px', lineHeight: '1.1', color: '#111', marginBottom: '16px' }}>
            PRIVACY<br /><span style={{ color: '#1B5E20' }}>POLICY</span>
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 14px', background: '#111', color: '#fff', fontFamily: '"Archivo Black"', fontSize: '11px', letterSpacing: '1px' }}>
              EFFECTIVE: MAY 2026
            </span>
            <span style={{ fontSize: '14px', color: '#888' }}>
              Last updated: May 11, 2026
            </span>
          </div>
        </div>

        {/* Intro box */}
        <div style={{ border: '3px solid #1B5E20', padding: '24px', background: '#e8f5e9', marginBottom: '48px', boxShadow: '6px 6px 0 #1B5E20' }}>
          <p style={{ fontSize: '16px', color: '#1B5E20', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
            Campus Connect is a free peer-to-peer marketplace for students across Ghana. We take your privacy seriously. This policy explains exactly what data we collect, why we need it, and how we protect it.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            num: '01',
            title: 'Who We Are',
            content: `Campus Connect is a student marketplace serving all 43 accredited universities in Ghana. We operate as a platform connecting students for peer-to-peer buying, selling, and campus service booking.

If you have questions about this privacy policy, contact us at: privacy@campusconnect.gh`,
          },
          {
            num: '02',
            title: 'What Data We Collect',
            content: `Account data: Email address, name, university, department, programme, year, hostel, optional phone number, bio, and profile photo.

Listing data: Product titles, descriptions, prices, photos, and WhatsApp contact numbers you choose to share.

Message data: Content of messages sent between users on the platform.

Usage data: Pages visited, searches performed, listings viewed (via Supabase and Vercel Analytics). We use this to improve the platform, not to sell ads.

Device data: Browser type, IP address, device type. Used for security and fraud prevention only.

We do NOT collect: Payment card numbers (Paystack handles payments end-to-end), precise GPS location, or social media credentials.`,
          },
          {
            num: '03',
            title: 'Why We Collect It',
            content: `We collect the minimum data needed to run the marketplace:

• Providing the service: Your profile data lets other students identify and trust you. Listing data makes your items discoverable.
• Safety and fraud prevention: We detect and block fake listings, scammers, and banned users.
• Improving the platform: Aggregate analytics help us understand which features students use most.
• Communicating with you: Transactional emails (listing approved, new message notifications). We do not send marketing emails without your consent.`,
          },
          {
            num: '04',
            title: 'Data Storage & Security',
            content: `Your data is stored on:

• Supabase (Postgres database) — hosted in the EU with strict Row-Level Security (RLS). Only you can read your private data.
• Cloudflare R2 — image storage with no public egress fees. Images are served via Cloudflare's CDN.
• Upstash Redis — ephemeral rate-limiting data. No personal information stored here.

Security measures in place:
• All traffic encrypted over HTTPS (TLS 1.3)
• HSTS headers enforced — no downgrade attacks
• JWT tokens validated server-side on every request
• All database queries protected by RLS policies
• Admin access logged and monitored via Sentry`,
          },
          {
            num: '05',
            title: 'Sharing Your Data',
            content: `We do not sell your data. Period.

We share minimal data with these service providers (strictly to operate the platform):
• Supabase — database and authentication hosting
• Cloudflare — CDN, image delivery, and DDoS protection
• Resend — transactional email delivery
• Inngest — background job processing (email triggers, notifications)
• Sentry — error monitoring (anonymised stack traces, no PII in error reports)
• Vercel Analytics — page view analytics (anonymised, GDPR-compliant)

Public data: Your profile name, university, bio, and active listings are public and may be indexed by search engines. Your email address, phone number, and messages are never public.`,
          },
          {
            num: '06',
            title: 'Your Rights',
            content: `You have the right to:

• Access your data: All your listings, messages, and profile data are visible in your account dashboard.
• Edit your data: Update your profile at any time from /profile.
• Delete your data: Use the "Delete Account" option in your profile settings. This permanently removes your account, all listings, and profile data. Messages may remain visible to the other party in a conversation.
• Opt out of notifications: Manage email preferences in your account settings.
• Data portability: Contact us to request a JSON export of your data.

To exercise any rights or request data deletion, contact: privacy@campusconnect.gh`,
          },
          {
            num: '07',
            title: 'Cookies',
            content: `We use only essential cookies:

• Supabase auth session cookie — keeps you logged in. Expires when you log out or after 7 days of inactivity.
• Rate limiting identifiers (Upstash) — prevent abuse. Session-scoped, no tracking.

We do not use advertising cookies, tracking pixels, or third-party analytics cookies. No cookie consent banner is required because we only set strictly necessary cookies.`,
          },
          {
            num: '08',
            title: 'Children & Student Users',
            content: `Campus Connect is designed for university students, who are typically 18+. We do not knowingly collect data from children under 13. If you believe a minor has created an account, contact us immediately.

For students under 18 at certain institutions: by using Campus Connect, you confirm that your parent or guardian has reviewed this policy and consents to your use of the platform.`,
          },
          {
            num: '09',
            title: 'Changes to This Policy',
            content: `We may update this policy as the platform grows. When we make material changes, we will:
• Post a notice on the homepage for 14 days
• Send an email notification to registered users
• Update the "Last updated" date at the top

Continued use of Campus Connect after policy updates constitutes acceptance of the revised policy.`,
          },
          {
            num: '10',
            title: 'Contact Us',
            content: `For privacy questions, data requests, or to report a concern:

Email: privacy@campusconnect.gh
Response time: Within 48 hours on business days

For account-related issues (banned account, listing removal): support@campusconnect.gh`,
          },
        ].map((section) => (
          <div key={section.num} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '36px', color: '#eee', lineHeight: 1, flexShrink: 0, width: '52px' }}>
                {section.num}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', color: '#111', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #111', textTransform: 'uppercase' }}>
                  {section.title}
                </h2>
                {section.content.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: '15px', color: para.startsWith('•') ? '#444' : '#555', lineHeight: 1.75, marginBottom: '12px', whiteSpace: 'pre-line' }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Footer nav */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #111', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ padding: '12px 24px', background: '#111', color: '#fff', fontFamily: '"Archivo Black"', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #1B5E20' }}>
            READ TERMS OF SERVICE →
          </Link>
          <Link href="/about" style={{ padding: '12px 24px', background: '#fff', color: '#111', fontFamily: '"Archivo Black"', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            ABOUT CAMPUS CONNECT
          </Link>
        </div>
      </div>
    </main>
  )
}
