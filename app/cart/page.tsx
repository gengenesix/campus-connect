import { redirect } from 'next/navigation'

// Campus Connect doesn't have a shopping cart — contact sellers directly via messages
export default function CartPage() {
  redirect('/goods')
}
