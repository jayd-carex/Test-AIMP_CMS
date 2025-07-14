import { NextResponse } from 'next/server'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-02-24.acacia',
// })

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
  })
  try {
    const { customerId } = await req.json()

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ active: false })
    }

    const subscription = subscriptions.data[0]

    return NextResponse.json({
      active: subscription.status === 'active',
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAt: subscription.cancel_at,
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
