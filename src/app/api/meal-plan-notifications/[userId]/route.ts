import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

// Allowed CORS origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  // Add other allowed origins here
]

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''

  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  return new NextResponse(null, { status: 204 })
}

// GET /api/meal-plan-notifications/[userId]
export async function GET(
  request: NextRequest,
  context: any
) {
  const origin = request.headers.get('origin') ?? ''
  const userId = context.params.userId

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      {
        status: 400,
        headers: corsHeaders(origin, 'GET'),
      }
    )
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'meal-plan-notifications',
      where: {
        email: {
          equals: userId,
        },
      },
    })

    if (result.docs.length === 0) {
      return NextResponse.json(
        { error: 'No meal plan notifications found' },
        {
          status: 404,
          headers: corsHeaders(origin, 'GET'),
        }
      )
    }

    return NextResponse.json(result.docs[0], {
      headers: corsHeaders(origin, 'GET'),
    })
  } catch (err) {
    console.error('❌ GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan notification' },
      {
        status: 500,
        headers: corsHeaders(origin, 'GET'),
      }
    )
  }
}

// POST /api/meal-plan-notifications/[userId]
export async function POST(
  request: NextRequest,
  context: any
) {
  const origin = request.headers.get('origin') ?? ''
  const userId = context.params.userId

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      {
        status: 400,
        headers: corsHeaders(origin, 'POST'),
      }
    )
  }

  try {
    const body = await request.json()
    const { planLastGenerated, mbPlan, selectedPlan, email } = body

    if (!planLastGenerated || !mbPlan || !selectedPlan || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        {
          status: 400,
          headers: corsHeaders(origin, 'POST'),
        }
      )
    }

    const payload = await getPayload({ config: configPromise })

    const created = await payload.create({
      collection: 'meal-plan-notifications',
      data: {
        userId,
        planLastGenerated,
        mbPlan,
        selectedPlan,
        email,
      },
    })

    return NextResponse.json(created, {
      status: 201,
      headers: corsHeaders(origin, 'POST'),
    })
  } catch (err) {
    console.error('❌ POST error:', err)
    return NextResponse.json(
      { error: 'Failed to create meal plan notification' },
      {
        status: 500,
        headers: corsHeaders(origin, 'POST'),
      }
    )
  }
}

// Reusable CORS headers
function corsHeaders(origin: string, method: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': method,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
