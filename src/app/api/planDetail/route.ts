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

// GET all plans
export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''

    const payload = await getPayload({
      config: configPromise,
    })

    const plans = await payload.find({
      collection: 'plans',
    })

    return NextResponse.json(plans.docs, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
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

// POST a new plan
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''

    const payload = await getPayload({
      config: configPromise,
    })

    const newPlan = await payload.create({
      collection: 'plans',
      data: await req.json(),
    })

    return NextResponse.json(newPlan, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
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
