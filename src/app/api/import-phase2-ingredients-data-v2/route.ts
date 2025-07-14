import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(req: Request) {
  const { ingredientData, userid } = await req.json()

  // Check if the required data (ingredientData and userid) are present
  if (!ingredientData || !userid) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Format the new category and items
    const formattedCategories = ingredientData?.ingredients?.map(
      (category: { category: string; items: string[] }) => ({
        categoryName: category.category,
        items: category.items.map((item: string) => ({ name: item })),
      }),
    )

    // Find the existing record for the user
    const existingEntry = await payload.find({
      collection: 'phase-2-ingredients',
      where: {
        user: { equals: userid },
      },
      limit: 1,
    })

    if (existingEntry.docs.length > 0) {
      // If the record exists, merge the new category with existing categories
      const existingCategories = existingEntry.docs[0].categories || []

      // Iterate over the new categories and either update or add them
      formattedCategories.forEach(
        (newCategory: { categoryName: string; items: { name: string }[] }) => {
          const existingCategory = existingCategories.find(
            (category: { categoryName: string; items: { name: string }[] }) =>
              category.categoryName === newCategory.categoryName,
          )

          if (existingCategory) {
            // If the category already exists, we update the items
            // Merge the items, avoid duplicates, and ensure unique items
            existingCategory.items = [
              ...existingCategory.items,
              ...newCategory.items.filter(
                (newItem: { name: string }) =>
                  !existingCategory.items.some(
                    (existingItem: { name: string }) => existingItem.name === newItem.name,
                  ),
              ),
            ]
          } else {
            // If the category doesn't exist, add it
            existingCategories.push(newCategory)
          }
        },
      )

      // Update the record with the new or merged categories
      await payload.update({
        collection: 'phase-2-ingredients',
        id: existingEntry.docs[0].id,
        data: {
          categories: existingCategories,
        },
      })

      return NextResponse.json({ message: 'Phase 2 ingredients data updated successfully' })
    } else {
      // If no entry exists, create a new one
      await payload.create({
        collection: 'phase-2-ingredients',
        data: {
          user: userid,
          categories: formattedCategories,
        },
      })

      return NextResponse.json({ message: 'Phase 2 ingredients data saved successfully' })
    }
  } catch (error) {
    console.error('Error saving ingredients data:', error)
    return NextResponse.json({ error: 'Failed to save ingredient data' }, { status: 500 })
  }
}
