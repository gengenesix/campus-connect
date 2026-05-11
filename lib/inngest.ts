import { Inngest } from 'inngest'
import { getResend, FROM_EMAIL } from './resend'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { sendPush, type PushSubscription } from './webpush'
import WelcomeEmail from '@/emails/WelcomeEmail'
import ListingApprovedEmail from '@/emails/ListingApprovedEmail'
import NewMessageEmail from '@/emails/NewMessageEmail'
import BookingRequestEmail from '@/emails/BookingRequestEmail'
import BookingConfirmedEmail from '@/emails/BookingConfirmedEmail'

// ── Inngest client ───────────────────────────────────────────────────────────
export const inngest = new Inngest({
  id: 'campus-connect',
  // Signing key is required in production — set INNGEST_SIGNING_KEY env var
})

// Supabase service-role client for server-side DB access inside Inngest jobs
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Missing Supabase service role credentials')
  return createClient(url, key)
}

// ── Helper: create in-app notification ──────────────────────────────────────
async function createNotification(supabase: ReturnType<typeof getServiceSupabase>, payload: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    })
  } catch (e) {
    console.error('[inngest] createNotification error:', e)
  }
}

// ── Job 1: Welcome email on new registration ─────────────────────────────────
export const sendWelcomeEmail = inngest.createFunction(
  { id: 'send-welcome-email', retries: 2, triggers: [{ event: 'user/registered' }] },
  async ({ event }: any) => {
    const { userId, email, name } = event.data as { userId: string; email: string; name: string }

    const resend = getResend()
    if (resend && email) {
      const html = await render(WelcomeEmail({ name: name || 'Student' }))
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to Campus Connect — Ghana\'s Student Marketplace',
        html,
      })
    }

    return { sent: !!resend, to: email }
  }
)

// ── Job 2: Listing approved ───────────────────────────────────────────────────
export const onListingApproved = inngest.createFunction(
  { id: 'on-listing-approved', retries: 3, triggers: [{ event: 'listing/approved' }] },
  async ({ event, step }: any) => {
    const { listingId, listingType } = event.data as {
      listingId: string
      listingType: 'product' | 'service'
    }

    const supabase = getServiceSupabase()

    // Fetch listing + seller in one step
    const listing = await step.run('fetch-listing', async () => {
      if (listingType === 'product') {
        const { data } = await supabase
          .from('products')
          .select('id, title, image_url, seller_id, seller:profiles!seller_id (name, email)')
          .eq('id', listingId)
          .single()
        return data
      } else {
        const { data } = await supabase
          .from('services')
          .select('id, name, image_url, provider_id, provider:profiles!provider_id (name, email)')
          .eq('id', listingId)
          .single()
        return data
      }
    })

    if (!listing) return { skipped: true, reason: 'listing not found' }

    const isProduct = listingType === 'product'
    const sellerId = isProduct ? (listing as any).seller_id : (listing as any).provider_id
    const sellerProfile = isProduct ? (listing as any).seller : (listing as any).provider
    const sellerName: string = sellerProfile?.name ?? 'Seller'
    const sellerEmail: string | undefined = sellerProfile?.email
    const listingTitle: string = isProduct ? (listing as any).title : (listing as any).name
    const listingUrl = `https://campusconnect.gh/${isProduct ? 'goods' : 'services'}/${listingId}`

    // Create in-app notification
    await step.run('create-notification', async () => {
      await createNotification(supabase, {
        userId: sellerId,
        type: 'listing_approved',
        title: 'Your listing is live!',
        body: `"${listingTitle}" has been approved and is now visible to students.`,
        data: { listingId, listingType, listingUrl },
      })
    })

    // Send email notification
    const resend = getResend()
    if (resend && sellerEmail) {
      await step.run('send-email', async () => {
        const html = await render(ListingApprovedEmail({
          sellerName,
          listingTitle,
          listingType,
          listingUrl,
          imageUrl: (listing as any).image_url,
        }))
        await resend.emails.send({
          from: FROM_EMAIL,
          to: sellerEmail,
          subject: `✓ Your listing "${listingTitle}" is now live on Campus Connect`,
          html,
        })
      })
    }

    return { notified: true, email: !!resend }
  }
)

// ── Job 3: New message notification ──────────────────────────────────────────

export const onMessageSent = inngest.createFunction(
  { id: 'on-message-sent', retries: 2, triggers: [{ event: 'message/sent' }] },
  async ({ event, step }: any) => {
    const { messageId, senderId, receiverId, productId } = event.data as {
      messageId: string
      senderId: string
      receiverId: string
      productId?: string
    }

    const supabase = getServiceSupabase()

    // Fetch sender + receiver profiles
    const { sender, receiver, listingTitle } = await step.run('fetch-profiles', async () => {
      const [senderRes, receiverRes] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', senderId).single(),
        supabase.from('profiles').select('name, email').eq('id', receiverId).single(),
      ])

      let listingTitle: string | undefined
      if (productId) {
        const { data } = await supabase.from('products').select('title').eq('id', productId).single()
        listingTitle = data?.title
      }

      return {
        sender: senderRes.data,
        receiver: receiverRes.data,
        listingTitle,
      }
    })

    if (!sender || !receiver) return { skipped: true }

    const senderName: string = sender.name ?? 'A student'
    const receiverName: string = receiver.name ?? 'Student'
    const receiverEmail: string | undefined = receiver.email
    const messagePreview = (event.data as any).contentPreview ?? 'Sent you a message'
    const replyUrl = `https://campusconnect.gh/messages`

    // Create in-app notification
    await step.run('create-notification', async () => {
      await createNotification(supabase, {
        userId: receiverId,
        type: 'message',
        title: `New message from ${senderName}`,
        body: messagePreview.length > 80 ? messagePreview.slice(0, 80) + '…' : messagePreview,
        data: { messageId, senderId, productId },
      })
    })

    // Send email if receiver has email (throttle: only first message in a thread)
    const resend = getResend()
    if (resend && receiverEmail) {
      await step.run('send-email', async () => {
        const html = await render(NewMessageEmail({
          recipientName: receiverName,
          senderName,
          messagePreview: messagePreview.length > 200 ? messagePreview.slice(0, 200) + '…' : messagePreview,
          listingTitle,
          replyUrl,
        }))
        await resend.emails.send({
          from: FROM_EMAIL,
          to: receiverEmail,
          subject: `${senderName} sent you a message on Campus Connect`,
          html,
        })
      })
    }

    // Send push notification if receiver has a push subscription
    await step.run('send-push', async () => {
      const { data: profile } = await supabase
        .from('profiles').select('push_sub').eq('id', receiverId).single()
      if (profile?.push_sub) {
        await sendPush(profile.push_sub as PushSubscription, {
          title: `New message from ${senderName}`,
          body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '…' : messagePreview,
          url: '/messages',
        })
      }
    })

    return { notified: true, email: !!resend }
  }
)

// ── Job 4: Booking requested — notify provider ────────────────────────────────
export const onBookingRequested = inngest.createFunction(
  { id: 'on-booking-requested', retries: 2, triggers: [{ event: 'booking/requested' }] },
  async ({ event, step }: any) => {
    const { bookingId, serviceName, clientId, providerId } = event.data as {
      bookingId: string; serviceName: string; clientId: string; providerId: string
    }
    const supabase = getServiceSupabase()

    const { client, provider, booking } = await step.run('fetch-data', async () => {
      const [clientRes, providerRes, bookingRes] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', clientId).single(),
        supabase.from('profiles').select('name, email').eq('id', providerId).single(),
        supabase.from('bookings').select('notes, scheduled_at').eq('id', bookingId).single(),
      ])
      return { client: clientRes.data, provider: providerRes.data, booking: bookingRes.data }
    })

    if (!client || !provider) return { skipped: true }

    await step.run('create-notification', async () => {
      await createNotification(supabase, {
        userId: providerId,
        type: 'booking_request',
        title: `New booking request from ${(client as any).name ?? 'a student'}`,
        body: `Someone wants to book your service: ${serviceName}`,
        data: { bookingId, serviceName, clientId },
      })
    })

    const resend = getResend()
    if (resend && (provider as any).email) {
      await step.run('send-email', async () => {
        const html = await render(BookingRequestEmail({
          providerName: (provider as any).name ?? 'Provider',
          clientName: (client as any).name ?? 'A student',
          serviceName,
          notes: (booking as any)?.notes ?? undefined,
          scheduledAt: (booking as any)?.scheduled_at
            ? new Date((booking as any).scheduled_at).toLocaleDateString('en-GH', { dateStyle: 'long' })
            : undefined,
          bookingUrl: `https://campusconnect.gh/bookings`,
        }))
        await resend.emails.send({
          from: FROM_EMAIL, to: (provider as any).email,
          subject: `New booking request: ${serviceName} — Campus Connect`, html,
        })
      })
    }
    // Push notification to provider
    await step.run('send-push', async () => {
      const { data: profile } = await supabase
        .from('profiles').select('push_sub').eq('id', providerId).single()
      if (profile?.push_sub) {
        await sendPush(profile.push_sub as PushSubscription, {
          title: 'New Booking Request',
          body: `${(client as any).name ?? 'A student'} wants to book: ${serviceName}`,
          url: '/bookings',
        })
      }
    })

    return { notified: true, email: !!resend }
  }
)

// ── Job 5: Booking confirmed — notify client ──────────────────────────────────
export const onBookingConfirmed = inngest.createFunction(
  { id: 'on-booking-confirmed', retries: 2, triggers: [{ event: 'booking/confirmed' }] },
  async ({ event, step }: any) => {
    const { bookingId, serviceId, clientId, providerId } = event.data as {
      bookingId: string; serviceId: string; clientId: string; providerId: string
    }
    const supabase = getServiceSupabase()

    const { client, provider, service, booking } = await step.run('fetch-data', async () => {
      const [clientRes, providerRes, serviceRes, bookingRes] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', clientId).single(),
        supabase.from('profiles').select('name, email').eq('id', providerId).single(),
        supabase.from('services').select('name, rate').eq('id', serviceId).single(),
        supabase.from('bookings').select('notes, scheduled_at').eq('id', bookingId).single(),
      ])
      return { client: clientRes.data, provider: providerRes.data, service: serviceRes.data, booking: bookingRes.data }
    })

    if (!client || !service) return { skipped: true }

    await step.run('create-notification', async () => {
      await createNotification(supabase, {
        userId: clientId,
        type: 'booking_confirmed',
        title: 'Booking confirmed!',
        body: `${(provider as any)?.name ?? 'Your provider'} confirmed your booking for ${(service as any).name}.`,
        data: { bookingId, serviceId },
      })
    })

    const resend = getResend()
    if (resend && (client as any).email) {
      await step.run('send-email', async () => {
        const html = await render(BookingConfirmedEmail({
          clientName: (client as any).name ?? 'Student',
          providerName: (provider as any)?.name ?? 'Provider',
          serviceName: (service as any).name,
          serviceRate: (service as any).rate ?? undefined,
          notes: (booking as any)?.notes ?? undefined,
          scheduledAt: (booking as any)?.scheduled_at
            ? new Date((booking as any).scheduled_at).toLocaleDateString('en-GH', { dateStyle: 'long' })
            : undefined,
          bookingUrl: `https://campusconnect.gh/bookings`,
        }))
        await resend.emails.send({
          from: FROM_EMAIL, to: (client as any).email,
          subject: `Booking confirmed: ${(service as any).name} — Campus Connect`, html,
        })
      })
    }

    // Push notification to client
    await step.run('send-push', async () => {
      const { data: profile } = await supabase
        .from('profiles').select('push_sub').eq('id', clientId).single()
      if (profile?.push_sub) {
        await sendPush(profile.push_sub as PushSubscription, {
          title: 'Booking Confirmed!',
          body: `${(provider as any)?.name ?? 'Your provider'} confirmed your ${(service as any).name} booking.`,
          url: '/bookings',
        })
      }
    })

    return { notified: true, email: !!resend }
  }
)
