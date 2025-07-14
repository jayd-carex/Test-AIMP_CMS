import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Initialize payload
    const payload = await getPayload({
      config: configPromise,
    })

    // Get raw body text first for debugging
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)

    // Parse the body
    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('JSON parse error:', e)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    console.log('Parsed body:', body)

    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // First get the existing user to preserve required fields
    const existingUser = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update with all required fields
    const updatedUser = await payload.update({
      collection: 'users',
      id: userId,
      data: {
        lastViewedCommunity: body?.timestamp || new Date().toISOString(),
      },
    })

    console.log('Update result:', updatedUser)

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      data: {
        id: userId,
        lastViewedCommunity: updatedUser.lastViewedCommunity,
      },
    })
  } catch (error) {
    console.error('Full error:', error)
    return NextResponse.json(
      {
        error: 'Update failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
