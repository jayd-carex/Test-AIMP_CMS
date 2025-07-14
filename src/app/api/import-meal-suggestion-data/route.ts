import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(req: Request) {
  const { mealData, userid } = await req.json()

  console.log(mealData, 'mealData--------------')
  console.log(userid)
  // Check if the required data (mealData and userid) are present
  //   if (!mealData || !userid) {
  //     return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
  //   }

  try {
    // Initialize Payload CMS
    const payload = await getPayload({ config: configPromise })

    // Prepare the meal data to be saved or updated
    // const mealDataBody = {
    //   name: 'Meal Suggestions',
    //   user: userid,
    //   Breakfasts: mealData?.Breakfasts,
    //   Lunches: mealData?.Lunches,
    //   Dinners: mealData?.Dinners,
    // }

    // Check if there is an existing entry for the user in the meal-suggestions collection
    const existingEntry = await payload.find({
      collection: 'meal-suggestions',
      where: {
        'user.id': { equals: userid },
      },
      limit: 1,
    })

    console.log(existingEntry, 'existingEntry------------------')

    console.log(mealData, 'mealData------------------------')

    // If entry exists, update it
    if (existingEntry.docs.length > 0) {
      await payload.update({
        collection: 'meal-suggestions',
        id: existingEntry.docs[0].id,
        data: mealData,
      })
      return NextResponse.json({ message: 'Meal suggestions data updated successfully' })
    } else {
      // If no entry exists, create a new one
      await payload.create({
        collection: 'meal-suggestions',
        data: mealData,
      })
      return NextResponse.json({ message: 'Meal suggestions data saved successfully' })
    }
  } catch (error) {
    console.log('errror-------------------', error)
    console.error('Error saving meal suggestions data:', error)
    console.log(error)
    return NextResponse.json({ error: 'Failed to save meal suggestions data' }, { status: 500 })
  }
}
