import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth') || '2'

    const payload = await getPayload({
      config: configPromise,
    })

    const posts = await payload.find({
      collection: 'posts',
      depth: parseInt(depth),
    })

    // For each post, get its likes
    const postsWithLikes = await Promise.all(
      posts.docs.map(async (post) => {
        const likes = await payload.find({
          collection: 'likes',
          where: {
            post: {
              equals: post.id,
            },
            isLiked: {
              equals: true,
            },
          },
          depth: 2,
        })

        return {
          ...post,
          likes: likes.docs,
          likesCount: likes.docs.length,
        }
      }),
    )

    return NextResponse.json(
      {
        ...posts,
        docs: postsWithLikes,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error?.message || 'Unknown error' },
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
