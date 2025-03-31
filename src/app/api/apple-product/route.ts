import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Define allowed origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  // Add other origins as needed
]

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return new NextResponse(null, { status: 204 })
}

// GET all appleProduct
export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''

    const payload = await getPayload({
      config: configPromise,
    })

    const appleProduct = await payload.find({
      collection: 'apple-product',
    })

    return NextResponse.json(appleProduct.docs, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching Apple Pay transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Apple Pay transactions' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}

// POST a new ApplePayTransaction
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const body = await req.json()

    const { productId, referenceName, subscriptionDuration } = body

    if (!productId || !referenceName || !subscriptionDuration) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, referenceName and subscriptionDuration' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const newAppleProduct = await payload.create({
      collection: 'apple-product',
      data: body,
    })

    return NextResponse.json(newAppleProduct, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error creating Apple Pay transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create Apple Pay transaction' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}
