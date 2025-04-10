import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.error()
  }

  let event

  const rawBody = await req.text()

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret)
  } catch (err) {
    console.log('Webhook signature verification failed:', err)
    return NextResponse.error()
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object
      console.log('Payment for invoice succeeded:', invoice)
      break

    case 'invoice.payment_failed':
      const invoid_failed = event.data.object
      console.log('Payment for invoice failed:', invoid_failed)
      break

    case 'invoice.paid':
      const invoice_paid = event.data.object as Stripe.Invoice

      const stripeCustomerID = invoice_paid.customer as string
      const subscriptionId = invoice_paid.subscription as string

      const planId = invoice_paid.lines.data[0]?.plan?.id || null
      const planName = invoice_paid.lines.data[0]?.description || 'default-plan'

      console.log(
        `💰 Invoice paid for customer: ${stripeCustomerID}, plan: ${planName}, planId: ${planId}`,
      )

      const payload = await getPayload({
        config: configPromise,
      })

      try {
        const users = await payload.find({
          collection: 'users',
          where: {
            stripeCustomerID: {
              equals: stripeCustomerID,
            },
          },
        })

        if (users.docs.length === 0) {
          console.error('❌ No user found with stripeCustomerID:', stripeCustomerID)
          break
        }

        const user = users.docs[0]

        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            currentActivePlan: planId || planName,
            planStatus: 'active',
          },
        })

        console.log(
          `✅ Updated user ${user.email} with active plan "${planName}" and plan ID "${planId}"`,
        )
      } catch (err) {
        console.error('❌ Failed to update user after invoice paid:', err)
      }

      break

    case 'invoice.overdue':
      const invoice_overdue = event.data.object
      console.log('Payment for invoice overdue:', invoice_overdue)
      break

    case 'customer.subscription.created':
      const createSubscription = event.data.object
      console.log('Subscription create:', createSubscription)
      break

    case 'customer.subscription.paused':
      const pauseSubscription = event.data.object
      console.log('Subscription pause:', pauseSubscription)
      break

    case 'customer.subscription.resumed':
      const resumeSubscription = event.data.object
      console.log('Subscription resume:', resumeSubscription)
      break

    case 'customer.subscription.deleted':
      const canceledSubscription = event.data.object
      console.log('Subscription canceled:', canceledSubscription)
      break

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object
      console.log('Subscription updated:', updatedSubscription)
      break

    case 'subscription_schedule.updated':
      const subscription_schedule_update = event.data.object
      console.log('Subscription schedule updated:', subscription_schedule_update)
      break

    case 'subscription_schedule.canceled':
      const subscription_schedule_cancel = event.data.object
      console.log('Subscription schedule cancel:', subscription_schedule_cancel)
      break

    case 'subscription_schedule.completed':
      const subscription_schedule_complete = event.data.object
      console.log('Subscription schedule complete:', subscription_schedule_complete)
      break

    case 'subscription_schedule.created':
      const subscription_schedule_created = event.data.object
      console.log('Subscription schedule created', subscription_schedule_created)
      break

    case 'subscription_schedule.expiring':
      const subscription_schedule_expire = event.data.object
      console.log('Subscription schedule expire:', subscription_schedule_expire)
      break

    case 'subscription_schedule.released':
      const subscription_schedule_release = event.data.object
      console.log('Subscription schedule release', subscription_schedule_release)
      break

    default:
      console.log('Unhandled event type:', event.type)
  }
  return NextResponse.json({ status: 'success' })
}
