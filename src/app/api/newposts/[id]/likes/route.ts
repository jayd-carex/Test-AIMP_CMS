import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteParams): Promise<Response> {
  try {
    const origin = request.headers.get('origin') ?? ''
    const resolvedParams = await context.params
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

export async function DELETE(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const postId = req.url.split('/posts/')[1].split('/likes')[0]
    if (!userId || !postId) {
      return NextResponse.json(
        { error: 'User ID and Post ID are required' },
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

    // Find the like document
    const likes = await payload.find({
      collection: 'likes',
      where: {
        AND: [
          {
            post: {
              equals: postId,
            },
          },
          {
            user: {
              equals: userId,
            },
          },
        ],
      },
    })

    if (likes.docs.length === 0) {
      return NextResponse.json(
        { error: 'Like not found' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    // Delete the like
    await payload.delete({
      collection: 'likes',
      id: likes.docs[0].id,
    })

    return NextResponse.json(
      { message: 'Like removed successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  } catch (error: any) {
    console.error('Error removing like:', error)
    return NextResponse.json(
      { error: 'Failed to remove like', details: error?.message || 'Unknown error' },
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
