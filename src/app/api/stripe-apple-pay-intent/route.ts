import { NextResponse } from 'next/server'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  try {
    const { currency = 'usd', deviceId } = await req.json()

    const customer = await stripe.customers.create({ name: deviceId })

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-02-24.acacia' },
    )

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: 'off_session',
    })

    return NextResponse.json({
      customerId: customer.id,
      ephemeralKeySecret: ephemeralKey.secret,
      setupIntentClientSecret: setupIntent.client_secret,
    })
  } catch (error) {
    console.error('SetupIntent error:', error)
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 })
  }
}
