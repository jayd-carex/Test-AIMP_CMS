import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const origin = request.headers.get('origin') ?? ''
    const resolvedParams = await params
    const postId = resolvedParams.id

    console.log('Fetching likes for post ID:', postId)

    const payload = await getPayload({
      config: configPromise,
    })

    // First, verify the post exists
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
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

    console.log('Found post:', post)

    // Try a simpler query first
    const likes = await payload.find({
      collection: 'likes',
      where: {
        post: {
          equals: postId,
        },
      },
      depth: 2,
    })

    console.log('Found likes:', likes)

    return NextResponse.json(likes, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch likes', details: error?.message || 'Unknown error' },
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
