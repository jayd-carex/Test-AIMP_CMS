import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(req: Request) {
  const { ingredientData, userid } = await req.json()

  if (!ingredientData || !userid) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const formattedCategories = ingredientData.ingredients.map((category: any) => ({
      categoryName: category.category,
      items: category.items.map((item: string) => ({ name: item })),
    }))

    const existingEntry = await payload.find({
      collection: 'phase-3-ingredients',
      where: {
        user: { equals: userid },
      },
      limit: 1,
    })

    if (existingEntry.docs.length > 0) {
      await payload.update({
        collection: 'phase-3-ingredients',
        id: existingEntry.docs[0].id,
        data: {
          categories: formattedCategories,
        },
      })
    } else {
      await payload.create({
        collection: 'phase-3-ingredients',
        data: {
          user: userid,
          categories: formattedCategories,
        },
      })
    }

    return NextResponse.json({ message: 'Phase 3 ingredients data saved successfully' })
  } catch (error) {
    console.error('Error saving ingredients data:', error)
    return NextResponse.json({ error: 'Failed to save ingredient data' }, { status: 500 })
  }
}
