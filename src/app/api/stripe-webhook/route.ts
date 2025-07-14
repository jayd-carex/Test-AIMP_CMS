import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
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
      const invoice_failed = event.data.object as Stripe.Invoice

      const stripeCustomerID_f = invoice_failed.customer as string
      const userEmail_f = invoice_failed.customer_email

      const payload_f = await getPayload({
        config: configPromise,
      })

      try {
        const users = await payload_f.find({
          collection: 'users',
          where: {
            email: {
              equals: userEmail_f,
            },
          },
        })

        if (users.docs.length === 0) {
          console.error('❌ No user found with email:', userEmail_f)
          break
        }

        const user = users.docs[0]

        await payload_f.update({
          collection: 'users',
          id: user.id,
          data: {
            currentActivePlan: 'no active plan',
            planStatus: 'inactive',
            stripeCustomerID: stripeCustomerID_f,
          },
        })
      } catch (err) {
        console.error('❌ Failed to update user after payment failure:', err)
      }
      break

    case 'invoice.paid':
      const invoice_paid = event.data.object as Stripe.Invoice

      const stripeCustomerID = invoice_paid.customer as string
      const userEmail = invoice_paid.customer_email

      const planId = invoice_paid.lines.data[0]?.plan?.id || null
      const planName = invoice_paid.lines.data[0]?.description || 'default-plan'

      const subscriptionId = invoice_paid.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const subscriptionEndDate = subscription.current_period_end
      const endDate = new Date(subscriptionEndDate * 1000)
      const formattedEndDate = endDate.toISOString()
      const planPeriod = subscription.items.data[0]?.plan?.interval || 'unknown'

      console.log(`Subscription ends on: ${endDate}`)

      const payload = await getPayload({
        config: configPromise,
      })

      try {
        const users = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: userEmail,
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
            stripeCustomerID: stripeCustomerID,
            planExpiryDate: formattedEndDate,
          },
        })

        await payload.create({
          collection: 'apple-pay-transactions',
          data: {
            userId: user.id,
            productId: planId || planName,
            transactionId: invoice_paid.id,
            planPeriod: planPeriod,
            planExpiryDate: formattedEndDate,
            transactionDate: new Date().toISOString(),
          },
        })
      } catch (err) {
        console.error('❌ Failed to update user after invoice paid:', err)
      }

      const now = new Date()
      const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now)
      const year = now.getFullYear()

      const tokenUsage = await payload.find({
        collection: 'open-ai-token-usages',
        where: {
          and: [
            { userEmail: { equals: userEmail } },
            { month: { equals: month } },
            { year: { equals: year } },
          ],
        },
        limit: 1,
      })

      if (tokenUsage.docs.length > 0) {
        const record = tokenUsage.docs[0]

        await payload.update({
          collection: 'open-ai-token-usages',
          id: record.id,
          data: {
            tokenUsed: 0,
          },
        })
        console.log('Token usage reset to 0 for user:', userEmail)
      } else {
        console.error('No token usage record found for user:', userEmail)
      }

      break

    // case 'invoice.overdue':
    //   const invoice_overdue = event.data.object
    //   console.log('Payment for invoice overdue:', invoice_overdue)
    //   break

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
      const deletedSubscription = event.data.object as Stripe.Subscription

      const stripeCustomerIDSd = deletedSubscription.customer as string
      const subscriptionIdSd = deletedSubscription.id
      const planIdSd = deletedSubscription.items.data[0]?.plan?.id || 'unknown'

      const cancelTime = new Date().toISOString()

      const payloadSd = await getPayload({
        config: configPromise,
      })

      try {
        const users = await payloadSd.find({
          collection: 'users',
          where: {
            stripeCustomerID: {
              equals: stripeCustomerIDSd,
            },
          },
        })

        if (users.docs.length === 0) {
          console.error('❌ No user found with stripeCustomerID:', stripeCustomerIDSd)
          break
        }

        const user = users.docs[0]

        await payloadSd.update({
          collection: 'users',
          id: user.id,
          data: {
            planStatus: 'cancelled',
          },
        })

        await payloadSd.create({
          collection: 'apple-pay-cancel-subscription',
          data: {
            userId: user.id,
            productId: planIdSd,
            cancelTime: cancelTime,
          },
        })

        console.log(`🧾 Subscription canceled for user ${user.email}`)
      } catch (err) {
        console.error('❌ Failed to handle subscription cancellation:', err)
      }

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
