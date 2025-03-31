import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Add PATCH endpoint to update read status
export async function PATCH(request: Request) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const url = new URL(request.url) // Parse the URL to extract the `id`
    const id = url.pathname.split('/')[4] // Extract the `id` from the URL

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const body = await request.json()
    const { read } = body // Get data from the request body

    const payload = await getPayload({
      config: configPromise,
    })

    // Update the notification status to read
    const result = await payload.update({
      collection: 'notifications-list',
      id: id,
      data: { read: read || true }, // Set read status
    })

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}

// Handle DELETE request for deleting notifications
export async function DELETE(request: Request) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const url = new URL(request.url) // Parse the URL to extract the `id`
    const id = url.pathname.split('/')[4] // Extract the `id` from the URL

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const result = await payload.delete({
      collection: 'notifications-list',
      id: id,
    })

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}
