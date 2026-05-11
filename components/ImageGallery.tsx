"use client"

import { useState } from 'react'
import Image from 'next/image'

interface GalleryImage {
  url: string
  alt?: string
}

interface Props {
  images: GalleryImage[]
  alt: string
  height?: number
}

export default function ImageGallery({ images, alt, height = 420 }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!images.length) {
    return (
      <div style={{ border: '3px solid #111', background: '#f0f0f0', height, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '8px 8px 0 #111' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div style={{ border: '3px solid #111', overflow: 'hidden', background: '#fff', boxShadow: '8px 8px 0 #111', position: 'relative', height }}>
        <Image
          src={images[0].url}
          alt={images[0].alt ?? alt}
          fill priority
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 55vw"
        />
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div style={{
        border: '3px solid #111', overflow: 'hidden', background: '#fff',
        boxShadow: '8px 8px 0 #111', position: 'relative', height,
        marginBottom: '10px',
      }}>
        <Image
          src={images[activeIdx].url}
          alt={images[activeIdx].alt ?? alt}
          fill priority
          style={{ objectFit: 'cover', transition: 'opacity 0.2s' }}
          sizes="(max-width: 768px) 100vw, 55vw"
        />

        {/* Prev/Next arrows */}
        {activeIdx > 0 && (
          <button
            onClick={() => setActiveIdx(i => i - 1)}
            style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              width: '36px', height: '36px', background: 'rgba(0,0,0,0.7)', color: '#fff',
              border: '2px solid #fff', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ‹
          </button>
        )}
        {activeIdx < images.length - 1 && (
          <button
            onClick={() => setActiveIdx(i => i + 1)}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              width: '36px', height: '36px', background: 'rgba(0,0,0,0.7)', color: '#fff',
              border: '2px solid #fff', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ›
          </button>
        )}

        {/* Counter badge */}
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          padding: '4px 10px', fontSize: '11px', fontWeight: 700,
        }}>
          {activeIdx + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{
              width: '72px', height: '72px', flexShrink: 0, padding: 0,
              border: `3px solid ${i === activeIdx ? '#111' : '#ddd'}`,
              background: '#f0f0f0', cursor: 'pointer', position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.15s',
              boxShadow: i === activeIdx ? '3px 3px 0 #111' : 'none',
            }}
          >
            <Image
              src={img.url}
              alt={`Photo ${i + 1}`}
              fill
              style={{ objectFit: 'cover', opacity: i === activeIdx ? 1 : 0.65 }}
              sizes="72px"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
