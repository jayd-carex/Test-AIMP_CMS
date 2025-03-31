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

  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return new NextResponse(null, { status: 204 })
}

// GET handler to fetch notifications
export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const payload = await getPayload({
      config: configPromise,
    })

    let query = {}
    if (userId) {
      query = {
        where: {
          userId: {
            equals: userId,
          },
        },
      }
    }

    const notifications = await payload.find({
      collection: 'notifications',
      ...query,
    })

    return NextResponse.json(notifications, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}

// Handle both POST and PATCH methods
async function handleRequest(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''

    const payload = await getPayload({
      config: configPromise,
    })

    const body = await req.json()
    const { userId, ...updateData } = body

    // First try to find existing notification
    const existingNotifications = await payload.find({
      collection: 'notifications',
      where: {
        userId: {
          equals: userId,
        },
      },
    })

    let result

    if (existingNotifications.docs.length > 0) {
      // Update existing notification
      result = await payload.update({
        collection: 'notifications',
        id: existingNotifications.docs[0].id,
        data: updateData,
      })
    } else {
      // Create new notification
      result = await payload.create({
        collection: 'notifications',
        data: {
          userId,
          ...updateData,
        },
      })
    }

    // Return response with CORS headers
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json(
      { error: 'Failed to process notification' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}

// Export handlers for both POST and PATCH
export const POST = handleRequest
export const PATCH = handleRequest

// Add DELETE handler
export async function DELETE(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)

    // Get the where parameter and parse it
    const whereParam = searchParams.get('where')
    let whereClause: any = {}

    if (whereParam) {
      try {
        // Decode and parse the where parameter
        const decodedWhere = decodeURIComponent(whereParam)
        whereClause = JSON.parse(decodedWhere)
      } catch (parseError) {
        console.error('Error parsing where clause:', parseError)
        return NextResponse.json(
          { error: 'Invalid where clause format' },
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          },
        )
      }
    } else {
      // Handle single ID deletion
      const id = searchParams.get('id')
      if (id) {
        whereClause = {
          id: {
            equals: id,
          },
        }
      } else {
        // Handle multiple IDs deletion
        const ids = searchParams.getAll('ids[]')
        if (ids && ids.length > 0) {
          whereClause = {
            id: {
              in: ids,
            },
          }
        }
      }
    }

    if (!whereClause || Object.keys(whereClause).length === 0) {
      return NextResponse.json(
        { error: 'Valid where clause or ID(s) are required for deletion' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    // Delete notifications based on the where clause
    const deletedNotifications = await payload.delete({
      collection: 'notifications',
      where: whereClause,
    })

    return NextResponse.json(deletedNotifications, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}
