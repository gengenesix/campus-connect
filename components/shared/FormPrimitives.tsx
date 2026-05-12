"use client"

import React from 'react'

// ─── Warning banner when profile is incomplete ────────────────────────────────
export function ProfileIncompleteWarning({ message }: { message: string }) {
  return (
    <div style={{ background: '#fff8e1', border: '2px solid #f59e0b', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>Complete your profile first</div>
        <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 10px' }}>{message}</p>
        <a href="/profile" style={{ display: 'inline-block', padding: '8px 18px', background: '#f59e0b', color: '#fff', fontFamily: '"Archivo Black", sans-serif', fontSize: '12px', textDecoration: 'none', border: '2px solid #111', letterSpacing: '0.5px' }}>
          COMPLETE PROFILE →
        </a>
      </div>
    </div>
  )
}

// ─── Red error banner ─────────────────────────────────────────────────────────
export function ErrorBanner({ error }: { error: string }) {
  if (!error) return null
  return (
    <div style={{ background: '#fee2e2', border: '2px solid #ef4444', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', color: '#dc2626', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>{error}</span>
    </div>
  )
}

// ─── Label + content wrapper ──────────────────────────────────────────────────
export function FormField({
  label,
  hint,
  labelSpacing = '8px',
  children,
}: {
  label: string
  hint?: React.ReactNode
  labelSpacing?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', marginBottom: labelSpacing }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>{hint}</p>}
    </div>
  )
}

// ─── Textarea with CSS focus border (replaces JS onFocus/onBlur) ───────────────
export function BrutalTextarea({
  focusColor = '#1B5E20',
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { focusColor?: string }) {
  return (
    <>
      <style>{`.brutal-ta:focus { border-color: ${focusColor} !important; }`}</style>
      <textarea
        className={`brutal-ta${className ? ` ${className}` : ''}`}
        style={{ width: '100%', padding: '13px 16px', border: '2px solid #111', fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.15s' }}
        {...props}
      />
    </>
  )
}

// ─── Main image upload zone ───────────────────────────────────────────────────
interface ImageUploadZoneProps {
  preview: string | null
  fileRef: React.RefObject<HTMLInputElement | null>
  onClear: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  emptyLabel?: string
  emptySubtext?: string
  emptyIcon?: React.ReactNode
  minHeight?: number
  previewMaxHeight?: number
}

const DefaultCameraIcon = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

export function ImageUploadZone({
  preview,
  fileRef,
  onClear,
  onChange,
  emptyLabel = 'Click to upload a photo',
  emptySubtext = 'JPG, PNG or WebP · Max 5MB',
  emptyIcon = DefaultCameraIcon,
  minHeight = 160,
  previewMaxHeight = 200,
}: ImageUploadZoneProps) {
  return (
    <div
      onClick={() => fileRef.current?.click()}
      style={{
        border: `2px dashed ${preview ? '#1B5E20' : '#111'}`,
        padding: '24px', cursor: 'pointer', textAlign: 'center',
        transition: 'all 0.2s',
        background: preview ? '#f0fdf4' : '#fff',
        minHeight: `${minHeight}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {preview ? (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt="Preview" style={{ maxHeight: `${previewMaxHeight}px`, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onClear() }}
            style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: '#888' }}>{emptyIcon}</div>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{emptyLabel}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>{emptySubtext}</div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} style={{ display: 'none' }} />
    </div>
  )
}

// ─── Additional photos thumbnail strip ────────────────────────────────────────
interface AdditionalPhotosGridProps {
  previews: string[]
  onRemove: (idx: number) => void
  onAddClick: () => void
  fileRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function AdditionalPhotosGrid({ previews, onRemove, onAddClick, fileRef, onChange }: AdditionalPhotosGridProps) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {previews.map((preview, idx) => (
        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
          <img src={preview} alt={`Additional ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', border: '2px solid #111', display: 'block' }} />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >✕</button>
        </div>
      ))}
      {previews.length < 4 && (
        <button
          type="button"
          onClick={onAddClick}
          style={{ width: '80px', height: '80px', border: '2px dashed #ddd', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#888', flexShrink: 0 }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>ADD</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onChange} style={{ display: 'none' }} />
    </div>
  )
}

// ─── +233 prefixed Ghana phone input ─────────────────────────────────────────
import { Input } from '@/components/ui/input'

interface GhanaPhoneInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function GhanaPhoneInput({ value, onChange, placeholder = '241234567', className }: GhanaPhoneInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#555', fontWeight: 700, pointerEvents: 'none', userSelect: 'none', zIndex: 1 }}>
        +233
      </span>
      <Input
        type="tel"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={9}
        className={`pl-[56px] text-[15px] border-[#ddd] focus-visible:border-[#25D366]${className ? ` ${className}` : ''}`}
      />
    </div>
  )
}
