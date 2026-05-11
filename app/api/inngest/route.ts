import { serve } from 'inngest/next'
import { inngest, sendWelcomeEmail, onListingApproved, onMessageSent, onBookingRequested, onBookingConfirmed } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendWelcomeEmail, onListingApproved, onMessageSent, onBookingRequested, onBookingConfirmed],
})
