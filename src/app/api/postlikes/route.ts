import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const postId = searchParams.get('postId')
    console.log('userId', userId)
    console.log('postId', postId)
    if (!userId || !postId) {
      return NextResponse.json(
        { error: 'Both userId and postId are required' },
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
      collection: 'likes',
      where: {
        and: [
          {
            user: {
              equals: userId,
            },
          },
          {
            post: {
              equals: postId,
            },
          },
        ],
      },
    })

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Failed to delete like' },
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

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const payload = await getPayload({
      config: configPromise,
    })

    const body = await req.json()

    const result = await payload.create({
      collection: 'likes',
      data: body,
    })

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Failed to create like' },
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
