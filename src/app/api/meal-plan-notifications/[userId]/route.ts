import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const url = new URL(request.url)
    const userId = url.pathname.split('/')[3]

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const mealPlanNotifications = await payload.find({
      collection: 'meal-plan-notifications',
      where: {
        email: {
          equals: userId,
        },
      },
    })

    if (mealPlanNotifications.docs.length === 0) {
      return NextResponse.json(
        { error: 'No meal plan notifications found for this user' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    return NextResponse.json(mealPlanNotifications.docs[0], {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching meal plan notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan notification' },
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

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const url = new URL(request.url)
    const userId = url.pathname.split('/')[3]

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    const body = await request.json()
    const { planLastGenerated, mbPlan, selectedPlan, email } = body

    // Validate required fields
    if (!planLastGenerated || !mbPlan || !selectedPlan || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const newMealPlanNotification = await payload.create({
      collection: 'meal-plan-notifications',
      data: {
        userId,
        planLastGenerated,
        mbPlan,
        selectedPlan,
        email,
      },
    })

    return NextResponse.json(newMealPlanNotification, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error creating meal plan notification:', error)
    return NextResponse.json(
      { error: 'Failed to create meal plan notification' },
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
