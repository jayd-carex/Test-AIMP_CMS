import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const body = await req.json()
    const { since } = body
    if (!since) {
      return NextResponse.json({ error: 'Missing since parameter' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const posts = await payload.find({
      collection: 'posts',
      sort: '-createdAt',
      limit: 1,
    })

    const latestPost = posts.docs[0]
    let hasNew = false
    if (latestPost && latestPost.createdAt) {
      const createdAtPlus10s = new Date(since)
      createdAtPlus10s.setSeconds(createdAtPlus10s.getSeconds() + 10)

      hasNew = new Date(latestPost.createdAt) > createdAtPlus10s
    }

    return NextResponse.json(
      { hasNew },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  } catch (error: any) {
    console.error('Error checking for new posts:', error)
    return NextResponse.json(
      { error: 'Failed to check for new posts', details: error?.message || 'Unknown error' },
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
