import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getUniversityBySlug } from '@/lib/ghana-universities'

interface Props {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const uni = getUniversityBySlug(slug)
  if (!uni) return { title: 'Not Found' }
  return {
    title: `${uni.shortName} Marketplace — Campus Connect`,
    description: `Buy, sell, and find services at ${uni.name}. Campus Connect — Ghana's student marketplace.`,
  }
}

export default async function UniLayout({ children, params }: Props) {
  const { slug } = await params
  const uni = getUniversityBySlug(slug)
  if (!uni) notFound()
  return <>{children}</>
}
