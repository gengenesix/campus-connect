"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { usePublicProfile } from '@/hooks/usePublicProfile'

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  provider: 'Service Provider',
  admin: 'Admin',
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { profile, listings, loading, notFound } = usePublicProfile(params.id)

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '18px', color: '#888' }}>Loading...</div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px 20px' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '48px' }}>404</div>
        <div style={{ fontSize: '16px', color: '#666' }}>This profile doesn&apos;t exist or has been removed.</div>
        <Link href="/" style={{ padding: '12px 28px', background: '#111', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '13px', textDecoration: 'none', border: '2px solid #111' }}>
          ← HOME
        </Link>
      </div>
    )
  }

  // Don't let users view their own profile via public route — redirect to edit page
  if (user && user.id === profile.id) {
    router.replace('/profile')
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: '"Archivo Black", sans-serif', color: '#888' }}>Redirecting...</div>
      </div>
    )
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ background: '#111', padding: '12px 20px' }}>
        <div className="container" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: '#86efac' }}>{profile.name ?? 'Profile'}</span>
        </div>
      </div>

      <SectionWrapper className="bg-[#f8f8f8]" innerClassName="max-w-[860px] mx-auto px-4">

        {/* Profile Card */}
        <div style={{ border: '3px solid #111', background: '#fff', boxShadow: '8px 8px 0 #111', marginBottom: '40px' }}>
          {/* Green header strip */}
          <div style={{ background: '#1B5E20', height: '80px' }} />

          <div style={{ padding: '0 32px 32px' }}>
            {/* Avatar */}
            <div style={{ marginTop: '-44px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name ?? 'User'}
                    width={88}
                    height={88}
                    style={{ borderRadius: '50%', border: '4px solid #fff', objectFit: 'cover', display: 'block' }}
                    onError={(e: any) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    background: '#1B5E20', color: '#fff', border: '4px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '28px',
                  }}>
                    {initials}
                  </div>
                )}
                {profile.is_verified && (
                  <div title="Verified by Campus Connect" style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '22px', height: '22px', background: '#1d9bf0', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', color: '#fff', fontWeight: 900, border: '2px solid #fff',
                  }}>✓</div>
                )}
              </div>

              {/* Message button — only show if logged in and not own profile */}
              {user && user.id !== profile.id && (
                <button
                  onClick={() => router.push(`/messages?with=${profile.id}`)}
                  style={{
                    padding: '12px 24px', background: '#111', color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                    border: '2px solid #111', cursor: 'pointer', letterSpacing: '0.5px',
                    boxShadow: '3px 3px 0 #1B5E20', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1B5E20' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#111' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    MESSAGE
                  </span>
                </button>
              )}
              {!user && (
                <Link
                  href={`/auth/login?redirect=/messages?with=${profile.id}`}
                  style={{
                    padding: '12px 24px', background: '#888', color: '#fff',
                    fontFamily: '"Archivo Black", sans-serif', fontSize: '13px',
                    border: '2px solid #111', textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    LOGIN TO MESSAGE
                  </span>
                </Link>
              )}
            </div>

            {/* Name + role */}
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '26px', marginBottom: '6px', color: '#111' }}>
                {profile.name ?? 'Campus Student'}
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ padding: '4px 12px', background: '#1B5E20', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {ROLE_LABELS[profile.role] ?? profile.role.toUpperCase()}
                </span>
                {profile.rating > 0 && (
                  <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {Number(profile.rating).toFixed(1)} · {profile.total_reviews} review{profile.total_reviews !== 1 ? 's' : ''}
                    </span>
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#aaa' }}>Member since {memberSince}</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#555', marginBottom: '20px', paddingLeft: '14px', borderLeft: '4px solid #1B5E20' }}>
                {profile.bio}
              </p>
            )}

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {profile.department && (
                <div style={{ padding: '12px 14px', background: '#f8f8f8', border: '2px solid #eee' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>DEPARTMENT</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{profile.department}</div>
                </div>
              )}
              {profile.course && (
                <div style={{ padding: '12px 14px', background: '#f8f8f8', border: '2px solid #eee' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>PROGRAMME</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{profile.course}</div>
                </div>
              )}
              {profile.class_year && (
                <div style={{ padding: '12px 14px', background: '#f8f8f8', border: '2px solid #eee' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>YEAR</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{profile.class_year}</div>
                </div>
              )}
              {profile.hostel && (
                <div style={{ padding: '12px 14px', background: '#f8f8f8', border: '2px solid #eee' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>HOSTEL</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{profile.hostel}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <div>
            <h2 style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '20px', textTransform: 'uppercase', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #111' }}>
              {profile.name?.split(' ')[0] ?? 'Their'}&apos;s Listings
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {listings.map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === 'good' ? `/goods/${item.id}` : `/services/${item.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{ border: '2px solid #eee', background: '#fff', overflow: 'hidden', transition: '0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #1B5E20' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eee'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ position: 'relative', height: '160px', background: '#f0f0f0' }}>
                      <Image
                        src={item.image_url ?? '/placeholder.jpg'}
                        alt={item.title ?? item.name ?? ''}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="220px"
                        onError={(e: any) => { e.currentTarget.src = '/placeholder.jpg' }}
                      />
                      <span style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: item.type === 'service' ? '#1B5E20' : '#111',
                        color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.5px',
                      }}>
                        {item.type === 'service' ? 'SERVICE' : 'GOODS'}
                      </span>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title ?? item.name}
                      </div>
                      <div style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '15px', color: '#1B5E20' }}>
                        {item.price != null ? `GH₵ ${item.price.toLocaleString()}` : (item.rate ?? 'Contact for price')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', border: '2px dashed #ddd', background: '#fff' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: '#ccc' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            </div>
            <div style={{ fontWeight: 700 }}>No active listings yet</div>
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '12px 24px', background: 'none', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            ← GO BACK
          </button>
        </div>
      </SectionWrapper>
    </>
  )
}
