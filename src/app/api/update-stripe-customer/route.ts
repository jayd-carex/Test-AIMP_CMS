// /api/stripe-update-customer/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is missing in environment variables!')
}

const stripe = new Stripe(stripeSecretKey)

export async function POST(req: Request) {
  try {
    const { customerId, firstName, lastName, email } = await req.json()

    // Update the customer information
    const updatedCustomer = await stripe.customers.update(customerId, {
      name: `${firstName} ${lastName}`,
      email: email,
    })

    return NextResponse.json({ updatedCustomer }, { status: 200 })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
