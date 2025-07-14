import { NextResponse } from 'next/server'
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-02-24.acacia',
// })

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })
  try {
    const { deviceId, customerId, promotionCode } = await req.json()

    let finalCustomerId = customerId

    if (!customerId && deviceId) {
      const newCustomer = await stripe.customers.create({ name: deviceId })
      finalCustomerId = newCustomer.id
    }

    if (!finalCustomerId) {
      throw new Error('Missing customerId or deviceId')
    }

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
          throw new Error(`Invalid or inactive promotion code: ${promotionCode}`)
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to validate promotion code'
        console.error('Promotion code validation error:', errorMessage)
        return NextResponse.json(
          {
            error: errorMessage,
            code: 'INVALID_PROMOTION_CODE',
          },
          { status: 400 },
        )
      }
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: finalCustomerId },
      { apiVersion: '2025-02-24.acacia' },
    )

    const setupIntent = await stripe.setupIntents.create({
      customer: finalCustomerId,
      usage: 'off_session',
    })

    return NextResponse.json({
      customerId: finalCustomerId,
      ephemeralKeySecret: ephemeralKey.secret,
      setupIntentClientSecret: setupIntent.client_secret,
      promotionCodeValid: validPromotion !== null,
      promotionDetails: validPromotion
        ? {
            id: validPromotion.id,
            amountOff: validPromotion.coupon.amount_off,
            percentOff: validPromotion.coupon.percent_off,
          }
        : null,
    })
  } catch (error: any) {
    console.error('SetupIntent error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create setup intent',
        code: error.code || 'SETUP_INTENT_ERROR',
      },
      { status: 400 },
    )
  }
}
