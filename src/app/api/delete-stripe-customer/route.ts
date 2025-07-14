import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
  })
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Delete the customer
    const deletedCustomer = await stripe.customers.del(customerId)

    return NextResponse.json({ success: true, deleted: deletedCustomer }, { status: 200 })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
