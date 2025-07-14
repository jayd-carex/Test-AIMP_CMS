import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth') || '2'
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const payload = await getPayload({
      config: configPromise,
    })

    const posts = await payload.find({
      collection: 'posts',
      depth: parseInt(depth),
      page: page,
      limit: limit,
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

        const comments = await payload.find({
          collection: 'comments',
          where: {
            post: {
              equals: post.id,
            },
          },
          depth: 2,
        })

        return {
          ...post,
          likes: likes.docs,
          comments: comments.docs,
          likesCount: likes.totalDocs,
          commentsCount: comments.totalDocs,
          isLiked: likes.docs.some((like) =>
            like.user && typeof like.user !== 'string' ? like.user.id === userId : false,
          ),
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

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const payload = await getPayload({
      config: configPromise,
    })

    const body = await req.json()

    const post = await payload.create({
      collection: 'posts',
      data: body,
    })

    return NextResponse.json(post, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post', details: error?.message || 'Unknown error' },
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

export async function PUT(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'PUT',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const body = await req.json()

    const updatedPost = await payload.update({
      collection: 'posts',
      id: postId,
      data: body,
    })

    return NextResponse.json(updatedPost, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'PUT',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post', details: error?.message || 'Unknown error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT',
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
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
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

    await payload.delete({
      collection: 'posts',
      id: postId,
    })

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  } catch (error: any) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post', details: error?.message || 'Unknown error' },
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

export async function PATCH(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
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

    const payload = await getPayload({
      config: configPromise,
    })

    const body = await req.json()

    const updatedPost = await payload.update({
      collection: 'posts',
      id: postId,
      data: body,
    })

    return NextResponse.json(updatedPost, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error patching post:', error)
    return NextResponse.json(
      { error: 'Failed to patch post', details: error?.message || 'Unknown error' },
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
