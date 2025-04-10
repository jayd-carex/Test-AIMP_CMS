import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { customerId, paymentMethodId, priceId } = await req.json()

    if (!customerId || !paymentMethodId || !priceId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    } catch (err: any) {
      if (err.code !== 'resource_already_exists') throw err
    }

    // Set default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice
    if (
      typeof invoice !== 'string' &&
      invoice?.payment_intent &&
      typeof invoice.payment_intent !== 'string'
    ) {
      return NextResponse.json({
        subscription,
        clientSecret: invoice.payment_intent.client_secret,
      })
    }

    return NextResponse.json({ error: 'Invalid payment intent' }, { status: 500 })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
