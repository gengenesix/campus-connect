"use client"

import { useState, useRef, useEffect } from 'react'
import { GHANA_UNIVERSITIES, type GhanaUniversity } from '@/lib/ghana-universities'

interface UniversityPickerProps {
  value: string           // university slug
  onChange: (slug: string, uni: GhanaUniversity | null) => void
  required?: boolean
  error?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  public: 'Public Universities',
  technical: 'Technical Universities',
  private: 'Private Universities',
}

// Group universities by type for the dropdown
const GROUPED = Object.entries(TYPE_LABELS).map(([type, label]) => ({
  type,
  label,
  unis: GHANA_UNIVERSITIES.filter(u => u.type === type).sort((a, b) => a.name.localeCompare(b.name)),
}))

export default function UniversityPicker({ value, onChange, required, error }: UniversityPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = GHANA_UNIVERSITIES.find(u => u.slug === value) ?? null

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = search.trim()
    ? GHANA_UNIVERSITIES.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.shortName.toLowerCase().includes(search.toLowerCase()) ||
        u.city.toLowerCase().includes(search.toLowerCase())
      ).sort((a, b) => a.name.localeCompare(b.name))
    : null // null = show grouped view

  const handleSelect = (uni: GhanaUniversity) => {
    onChange(uni.slug, uni)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', null)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '13px 16px',
          border: `2px solid ${error ? '#f59e0b' : open ? '#1B5E20' : '#111'}`,
          background: '#fff',
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ color: selected ? '#111' : '#999', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <span>
              <strong>{selected.shortName}</strong>
              <span style={{ color: '#666', fontWeight: 400 }}> — {selected.name}</span>
            </span>
          ) : (
            <span style={{ color: '#999' }}>
              Select your university{required ? ' *' : ''}
            </span>
          )}
        </span>
        <span style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {selected && (
            <span
              onClick={handleClear}
              style={{ fontSize: '16px', color: '#888', lineHeight: 1, padding: '0 4px', cursor: 'pointer' }}
              title="Clear"
            >×</span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#666" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0, right: 0,
          background: '#fff',
          border: '2px solid #111',
          boxShadow: '6px 6px 0 #111',
          zIndex: 999,
          maxHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search universities..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid #111',
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered ? (
              // Search results — flat list
              filtered.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                  No universities found
                </div>
              ) : (
                filtered.map(uni => (
                  <UniOption key={uni.slug} uni={uni} selected={value === uni.slug} onSelect={handleSelect} />
                ))
              )
            ) : (
              // Grouped view
              GROUPED.map(group => (
                <div key={group.type}>
                  <div style={{
                    padding: '6px 14px',
                    background: '#f8f8f8',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: '#888',
                    borderBottom: '1px solid #eee',
                    borderTop: '1px solid #eee',
                  }}>
                    {group.label.toUpperCase()} ({group.unis.length})
                  </div>
                  {group.unis.map(uni => (
                    <UniOption key={uni.slug} uni={uni} selected={value === uni.slug} onSelect={handleSelect} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function UniOption({
  uni, selected, onSelect,
}: { uni: GhanaUniversity; selected: boolean; onSelect: (u: GhanaUniversity) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(uni)}
      style={{
        width: '100%',
        padding: '10px 14px',
        textAlign: 'left',
        border: 'none',
        borderBottom: '1px solid #f0f0f0',
        background: selected ? '#e8f5e9' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#f8f8f8' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#fff' }}
    >
      {/* Short name badge */}
      <span style={{
        minWidth: '52px',
        padding: '3px 6px',
        background: selected ? '#1B5E20' : '#111',
        color: '#fff',
        fontFamily: '"Archivo Black", sans-serif',
        fontSize: '9px',
        letterSpacing: '0.5px',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {uni.shortName}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {uni.name}
        </span>
        <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '1px' }}>
          {uni.city} · {uni.region} Region
        </span>
      </span>
      {selected && (
        <span style={{ color: '#1B5E20', fontWeight: 900, fontSize: '16px', flexShrink: 0 }}>✓</span>
      )}
    </button>
  )
}
