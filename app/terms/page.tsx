import Link from 'next/link'
import type { Metadata } from 'next'
import SectionWrapper from '@/components/ui/SectionWrapper'

export const metadata: Metadata = {
  title: 'Terms of Service — Campus Connect',
  description: 'Terms and conditions for using Campus Connect — Ghana\'s free student marketplace across 43 universities.',
}

export default function TermsPage() {
  return (
    <>
      {/* Header strip */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: '#a78bfa' }}>Terms of Service</span>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]" innerClassName="max-w-[860px] mx-auto px-4">
        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '52px', lineHeight: '1.1', color: '#111', marginBottom: '16px' }}>
            TERMS OF<br /><span style={{ color: '#5d3fd3' }}>SERVICE</span>
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 14px', background: '#5d3fd3', color: '#fff', fontFamily: '"Archivo Black"', fontSize: '11px', letterSpacing: '1px' }}>
              EFFECTIVE: MAY 2026
            </span>
            <span style={{ fontSize: '14px', color: '#888' }}>
              Last updated: May 11, 2026
            </span>
          </div>
        </div>

        {/* Intro box */}
        <div style={{ border: '3px solid #111', padding: '24px', background: '#fff', marginBottom: '48px', boxShadow: '6px 6px 0 #111' }}>
          <p style={{ fontSize: '16px', color: '#111', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
            By creating an account or using Campus Connect, you agree to these terms. Read them carefully — they are written in plain language, not legalese. If you disagree with any part, please do not use the platform.
          </p>
        </div>

        {[
          {
            num: '01',
            title: 'What Campus Connect Is',
            content: `Campus Connect is a free peer-to-peer marketplace for students across Ghana's 43 accredited universities. We connect buyers and sellers, and students with campus service providers.

We are a platform — not a party to any transaction. Campus Connect does not own, store, or ship any goods. We do not employ service providers. All transactions are directly between students.

The platform is provided free of charge. A monthly subscription (GHS 20) is required only for sellers who wish to post listings.`,
          },
          {
            num: '02',
            title: 'Who Can Use Campus Connect',
            content: `You may use Campus Connect if you:
• Are currently enrolled at, or recently graduated from, a Ghanaian university
• Are at least 13 years old (parental consent required under 18)
• Are not banned or suspended from the platform
• Agree to use the platform lawfully and honestly

You may not create multiple accounts to evade a ban. You may not create accounts on behalf of others without their explicit consent.`,
          },
          {
            num: '03',
            title: 'What You Can and Cannot List',
            content: `PERMITTED:
• Used or new goods (electronics, books, furniture, clothing, food items)
• Campus services (tutoring, laundry, braiding, printing, typing, delivery)
• Handmade items and student-created products

STRICTLY PROHIBITED:
• Illegal goods — weapons, drugs, stolen property, counterfeit items
• Adult content of any kind
• Financial instruments — fake currencies, fraudulent investments
• Items that require professional licensing (prescription medication, firearms)
• Listings that are intentionally misleading or fraudulent
• Goods you do not own or have no right to sell

Violation results in immediate permanent ban and, for illegal activity, referral to campus security or Ghana Police Service.`,
          },
          {
            num: '04',
            title: 'Seller Responsibilities',
            content: `As a seller or service provider, you agree that:

• Your listings are accurate and honestly described
• You have the right to sell or offer the goods/services listed
• Prices are in Ghanaian Cedis (GHS) and reflect the actual ask
• You will respond to buyers in a timely manner
• You will complete confirmed transactions in good faith
• You will not post the same listing multiple times (duplicate spam)
• Photos must show the actual item — stock images are not allowed for physical goods

Campus Connect may remove listings that appear inaccurate, duplicate, or spam without notice.`,
          },
          {
            num: '05',
            title: 'Buyer Responsibilities',
            content: `As a buyer or service client, you agree that:

• You will inspect goods before payment
• You understand that all sales are peer-to-peer — Campus Connect is not a guarantor
• You will not attempt to pay fraudulently or dispute legitimate charges
• You will give honest, fair reviews after transactions
• You will meet in safe, public campus locations for exchanges
• You will report listings that appear fraudulent or illegal

Campus Connect strongly recommends always meeting on campus in public locations. Never transfer money before receiving and inspecting an item.`,
          },
          {
            num: '06',
            title: 'Messaging & Communication',
            content: `The in-app messaging system is provided for transaction-related communication only. You agree not to use messages to:
• Send spam, unsolicited advertisements, or bulk messages
• Harass, threaten, or abuse other users
• Share external payment links or request off-platform payments
• Solicit personal information from other students

All messages are stored securely and may be reviewed by Campus Connect administrators if a report is filed. We only review messages when investigating a specific complaint.`,
          },
          {
            num: '07',
            title: 'Intellectual Property',
            content: `You retain ownership of all content you post (photos, descriptions, etc.). By posting on Campus Connect, you grant us a non-exclusive, royalty-free licence to display your content on the platform and in promotional materials.

Campus Connect's brand, design system, code, and trademarks are protected. You may not copy or reproduce any part of the platform without written permission.`,
          },
          {
            num: '08',
            title: 'Subscriptions & Payments',
            content: `Campus Connect is free for buyers. Sellers pay GHS 20/month to post listings.

Payments are processed by Paystack (a licensed Ghanaian payment processor). Campus Connect does not store payment card details.

Subscription terms:
• Monthly subscription: auto-renews unless cancelled
• Cancellation takes effect at end of the billing period
• No refunds for partial months
• If your subscription lapses, existing listings are paused (not deleted) until you renew

Campus Connect reserves the right to change subscription pricing with 30 days notice.`,
          },
          {
            num: '09',
            title: 'Disputes Between Users',
            content: `Campus Connect is not a party to transactions between users. If a dispute arises:

1. First: contact the other party via in-app messaging to resolve directly
2. If unresolved: submit a report via the "⚑ Report" button on the listing or user profile
3. Campus Connect will review the report and may mediate, warn, or ban users

For serious disputes (fraud, theft, violence): contact your university security office or Ghana Police Service directly. Campus Connect will cooperate with law enforcement when legally required.`,
          },
          {
            num: '10',
            title: 'Account Suspension & Termination',
            content: `Campus Connect may suspend or permanently ban your account if you:
• Violate any part of these terms
• Post prohibited content
• Receive multiple valid reports from other users
• Attempt to manipulate reviews or the rating system
• Engage in scams, fraud, or deception

Upon ban: all your listings are removed. You may appeal a ban by emailing appeals@campusconnect.gh within 14 days with a clear explanation. We review all appeals.

You may delete your own account at any time from your profile settings. Deletion is irreversible.`,
          },
          {
            num: '11',
            title: 'Limitation of Liability',
            content: `Campus Connect provides the platform on an "as is" basis. To the fullest extent permitted by Ghanaian law:

• We make no warranties about the accuracy of listings
• We are not liable for any goods that are lost, stolen, broken, or not as described
• We are not liable for any financial losses from peer-to-peer transactions
• We are not liable for service quality from campus service providers
• Our total liability to you shall not exceed GHS 200 in any circumstances

This does not affect your statutory rights under Ghanaian consumer protection law.`,
          },
          {
            num: '12',
            title: 'Governing Law',
            content: `These terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved under the jurisdiction of the courts of Ghana.

If any part of these terms is found unenforceable, the remaining terms continue in full effect.`,
          },
          {
            num: '13',
            title: 'Changes to These Terms',
            content: `We may update these terms as the platform grows. We will notify you via:
• A banner on the homepage for 14 days
• An email to your registered address

Continued use of Campus Connect after the notice period constitutes acceptance. If you disagree with updated terms, delete your account before the terms take effect.`,
          },
          {
            num: '14',
            title: 'Contact',
            content: `Legal & compliance: legal@campusconnect.gh
Ban appeals: appeals@campusconnect.gh
General support: support@campusconnect.gh

We aim to respond within 48 hours on business days.`,
          },
        ].map((section) => (
          <div key={section.num} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', color: '#eee', lineHeight: 1, flexShrink: 0, width: '52px' }}>
                {section.num}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', color: '#111', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #111', textTransform: 'uppercase' }}>
                  {section.title}
                </h2>
                {section.content.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: '15px', color: '#555', lineHeight: 1.75, marginBottom: '12px', whiteSpace: 'pre-line' }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Footer nav */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #111', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ padding: '12px 24px', background: '#111', color: '#fff', fontFamily: '"Archivo Black"', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #5d3fd3' }}>
            READ PRIVACY POLICY →
          </Link>
          <Link href="/about" style={{ padding: '12px 24px', background: '#fff', color: '#111', fontFamily: '"Archivo Black"', fontSize: '13px', textDecoration: 'none', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            ABOUT CAMPUS CONNECT
          </Link>
        </div>
      </SectionWrapper>
    </>
  )
}
