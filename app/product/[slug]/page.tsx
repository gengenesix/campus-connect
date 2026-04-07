import { redirect } from 'next/navigation'

export default function LegacyProductPage({ params }: { params: { slug: string } }) {
  redirect(`/goods/${params.slug}`)
}
