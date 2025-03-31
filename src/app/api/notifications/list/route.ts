import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const body = await req.json()
    const { userId, title, message, notificationType, displayTime } = body

    const payload = await getPayload({
      config: configPromise,
    })

    const notification = await payload.create({
      collection: 'notifications-list',
      data: {
        userId,
        title,
        message,
        notificationType,
        read: false,
        displayTime,
        createdAt: new Date().toISOString(),
      },
    })

    return NextResponse.json(notification, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const notifications = await payload.find({
      collection: 'notifications-list',
      where: {
        userId: {
          equals: userId,
        },
      },
      sort: '-createdAt',
    })

    return NextResponse.json(notifications.docs, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
