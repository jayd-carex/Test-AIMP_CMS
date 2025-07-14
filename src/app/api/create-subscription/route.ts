import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
  try {
    const { customerId, paymentMethodId, priceId, promotionCode } = await req.json()

    if (!customerId || !paymentMethodId || !priceId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    } catch (err: any) {
      if (err.code !== 'resource_already_exists') throw err
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Validate promotion code if provided
    let validPromotion = null
    if (promotionCode) {
      try {
        const promotions = await stripe.promotionCodes.list({
          code: promotionCode,
          active: true,
        })
        validPromotion = promotions.data[0]

        if (!validPromotion) {
          return NextResponse.json(
            { error: `Invalid or inactive promotion code: ${promotionCode}` },
            { status: 400 },
          )
        }
      } catch (error) {
        console.error('Promotion code validation error:', error)
        return NextResponse.json({ error: 'Failed to validate promotion code' }, { status: 400 })
      }
    }

    const subscriptionData = {
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
      promotion_code: validPromotion?.id,
    }

    const subscription = await stripe.subscriptions.create(subscriptionData)

    const invoice = subscription.latest_invoice
    if (
      typeof invoice !== 'string' &&
      invoice?.payment_intent &&
      typeof invoice.payment_intent !== 'string'
    ) {
      return NextResponse.json({
        subscription,
        clientSecret: invoice.payment_intent.client_secret,
        appliedPromotion: validPromotion
          ? {
              code: promotionCode,
              amountOff: validPromotion.coupon.amount_off,
              percentOff: validPromotion.coupon.percent_off,
            }
          : null,
      })
    }

    return NextResponse.json({ error: 'Invalid payment intent' }, { status: 500 })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
