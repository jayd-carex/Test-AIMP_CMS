import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
  })

  try {
    const { promotionCode, priceId } = await req.json()

    if (!promotionCode || !priceId) {
      return NextResponse.json({ error: 'Missing promotion code or price ID' }, { status: 400 })
    }

    // Get the price details
    const price = await stripe.prices.retrieve(priceId)

    // Validate promotion code
    const promotions = await stripe.promotionCodes.list({
      code: promotionCode,
      active: true,
    })

    const validPromotion = promotions.data[0]

    if (!validPromotion) {
      return NextResponse.json(
        {
          error: `Invalid or inactive promotion code: ${promotionCode}`,
          code: 'INVALID_PROMOTION_CODE',
          isValid: false,
        },
        { status: 400 },
      )
    }

    // Calculate discounted price
    const originalAmount = price.unit_amount || 0
    let discountedAmount = originalAmount

    if (validPromotion.coupon.percent_off) {
      discountedAmount = originalAmount * (1 - validPromotion.coupon.percent_off / 100)
    } else if (validPromotion.coupon.amount_off) {
      discountedAmount = originalAmount - validPromotion.coupon.amount_off
    }

    return NextResponse.json({
      isValid: true,
      promotionDetails: {
        id: validPromotion.id,
        code: promotionCode,
        amountOff: validPromotion.coupon.amount_off,
        percentOff: validPromotion.coupon.percent_off,
        originalAmount,
        discountedAmount: Math.max(0, discountedAmount),
        currency: price.currency,
      },
    })
  } catch (error: any) {
    console.error('Promotion code validation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to validate promotion code',
        code: error.code || 'VALIDATION_ERROR',
        isValid: false,
      },
      { status: 400 },
    )
  }
}
