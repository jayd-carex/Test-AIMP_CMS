import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userIdOrEmail = searchParams.get('userIdOrEmail')

  if (!userIdOrEmail) {
    return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const mealSuggestions = await payload.find({
      collection: 'phase-2-ingredients' as const,
      where: userIdOrEmail.includes('@')
        ? { 'user.email': { equals: userIdOrEmail } }
        : { user: { equals: userIdOrEmail } },
      sort: 'name',
    })

    return NextResponse.json(mealSuggestions.docs)
  } catch (error) {
    console.error('Error fetching phase 2 ingredients:', error)

    return NextResponse.json({ error: 'Failed to fetch meal suggestions' }, { status: 500 })
  }
}
