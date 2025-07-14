import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const { searchParams } = new URL(request.url)
    const depth = searchParams.get('depth') || '2'
    const resolvedParams = await params
    const postId = resolvedParams.id

    const payload = await getPayload({
      config: configPromise,
    })

    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: parseInt(depth),
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

    const likes = await payload.find({
      collection: 'likes',
      where: {
        post: {
          equals: postId,
        },
        isLiked: {
          equals: true,
        },
      },
      depth: 2,
    })

    const comments = await payload.find({
      collection: 'comments',
      where: {
        post: {
          equals: postId,
        },
      },
      depth: 2,
    })

    const postWithLikes = {
      ...post,
      likes: likes.docs,
      comments: comments.docs,
      likesCount: likes.docs.length,
      commentsCount: comments.docs.length,
    }

    return NextResponse.json(postWithLikes, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post', details: error?.message || 'Unknown error' },
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
