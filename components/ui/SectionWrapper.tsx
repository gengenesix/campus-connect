import React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  /** Optional eyebrow label above the title */
  label?: string
  /** Section heading — accepts ReactNode for inline colour spans */
  title?: React.ReactNode
  /** Subtitle / lead text below the heading */
  subtitle?: string
  /** Dark background (#111 + white text). Override bg via className. */
  dark?: boolean
  /**
   * Extra classes on the <section> element.
   * Passed through tailwind-merge so a `bg-[#xxx]` here overrides the
   * default bg-white / bg-[#111] from the dark prop.
   */
  className?: string
  /** Extra classes on the inner max-w-6xl container */
  innerClassName?: string
  /**
   * Skip the inner container div — use for full-bleed sections
   * (e.g. showcase scrolls). Manual max-w containers can still be added
   * inside children as needed.
   */
  fullBleed?: boolean
  id?: string
}

export default function SectionWrapper({
  children,
  label,
  title,
  subtitle,
  dark = false,
  className = '',
  innerClassName = '',
  fullBleed = false,
  id,
}: Props) {
  const hasHeader = label || title || subtitle

  const header = hasHeader ? (
    <div className="text-center mb-10">
      {label && (
        <p style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: dark ? '#a78bfa' : '#5d3fd3',
          marginBottom: '10px',
          margin: '0 0 10px',
        }}>
          {label}
        </p>
      )}
      {title && (
        <h2 style={{
          fontFamily: '"Archivo Black", sans-serif',
          fontSize: 'clamp(28px, 4vw, 48px)',
          lineHeight: 1,
          margin: 0,
          color: dark ? '#fff' : '#111',
        }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{
          color: dark ? '#888' : '#666',
          fontSize: '16px',
          marginTop: '12px',
          lineHeight: 1.6,
          marginBottom: 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  ) : null

  const sectionClass = cn(
    'py-10 md:py-16',
    dark ? 'bg-[#111] text-white' : 'bg-white',
    className,
  )

  const containerClass = cn('max-w-6xl mx-auto px-4', innerClassName)

  return (
    <section id={id} className={sectionClass}>
      {fullBleed ? (
        <>
          {header && <div className={containerClass}>{header}</div>}
          {children}
        </>
      ) : (
        <div className={containerClass}>
          {header}
          {children}
        </div>
      )}
    </section>
  )
}
