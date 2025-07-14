import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get raw body text for debugging
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('JSON parse error:', e)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { ingredientId, exclude, userId } = body
    if (!ingredientId) {
      return NextResponse.json({ error: 'ingredientId is required' }, { status: 400 })
    }

    // Fetch the ingredient using a where condition
    const ingredient = await payload.find({
      collection: 'phase-2-ingredients',
      where: {
        'user.email': { equals: userId },
        'categories.items.id': { equals: ingredientId },
      },
    })

    // If no ingredient is found
    if (!ingredient.docs || ingredient.docs.length === 0) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Loop through categories and items to update the exclude property
    const updatedCategories = ingredient.docs[0].categories.map((category) => {
      category.items = category.items.map((item) => {
        if (item.id === ingredientId) {
          item.exclude = exclude // Update the exclude property
        }
        return item
      })
      return category
    })

    // Update the ingredient in the database
    await payload.update({
      collection: 'phase-2-ingredients',
      id: ingredient.docs[0].id,
      data: { categories: updatedCategories },
    })

    return NextResponse.json({
      success: true,
      message: 'Ingredient exclusion updated successfully',
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
