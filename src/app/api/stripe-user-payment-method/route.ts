import { NextResponse } from 'next/server'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
  const { customerId } = await req.json()

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    if (!paymentMethods.data.length) {
      return NextResponse.json({ error: 'No payment methods found' }, { status: 404 })
    }

    return NextResponse.json({ paymentMethodId: paymentMethods.data[0].id })
  } catch (error) {
    console.error('Fetch PM error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 })
  }
}
