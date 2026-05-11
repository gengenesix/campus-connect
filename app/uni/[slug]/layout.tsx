import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getUniversityBySlug } from '@/lib/ghana-universities'

interface Props {
  children: ReactNode
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const uni = getUniversityBySlug(params.slug)
  if (!uni) return { title: 'Not Found' }
  return {
    title: `${uni.shortName} Marketplace — Campus Connect`,
    description: `Buy, sell, and find services at ${uni.name}. Campus Connect — Ghana's student marketplace.`,
  }
}

export default function UniLayout({ children, params }: Props) {
  const uni = getUniversityBySlug(params.slug)
  if (!uni) notFound()
  return <>{children}</>
}
