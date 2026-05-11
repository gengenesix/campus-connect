/**
 * Design Tokens — Campus Connect
 * 8pt grid spacing system. Use these constants instead of arbitrary values.
 * All spacing is in px; Tailwind class equivalents shown in comments.
 */

export const spacing = {
  xs:  4,   // gap-1  / p-1  / m-1
  sm:  8,   // gap-2  / p-2  / m-2
  md:  16,  // gap-4  / p-4  / m-4
  lg:  24,  // gap-6  / p-6  / m-6
  xl:  32,  // gap-8  / p-8  / m-8
  '2xl': 48, // gap-12 / p-12 / m-12
  '3xl': 64, // gap-16 / p-16 / m-16
} as const

/**
 * Tailwind utility shortcuts — import and use instead of arbitrary style={{}} values.
 *
 * RULES:
 * - Section vertical padding : py-10 (mobile) + md:py-16 (desktop). NEVER py-24+
 * - Content max-width         : max-w-6xl mx-auto px-4
 * - Card padding              : p-4 or p-5 only
 * - Grid / flex gaps          : gap-3 or gap-4 only
 * - Heading → body gap        : mb-2 or mb-3 only
 * - Section → section gap     : mb-16 max, NEVER mb-24+
 */
export const tw = {
  // Section containers
  section:    'py-10 md:py-16',
  container:  'max-w-6xl mx-auto px-4',

  // Card padding
  card:       'p-4',
  cardMd:     'p-5',

  // Grid / flex gaps (choose one)
  gapSm:      'gap-3',
  gap:        'gap-4',

  // Text spacing
  headingGap: 'mb-2',
  bodyGap:    'mb-3',

  // Section spacing (between major sections)
  sectionGap: 'mb-16',
} as const

export type SpacingKey = keyof typeof spacing
