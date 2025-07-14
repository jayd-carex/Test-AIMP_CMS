import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { PromptType } from '@/collections/TextExtractPrompts'

let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image, image2, userid, context } = body

    let imageDataUri = image
    let imageDataUriphase2 = image || null
    let ingredientData
    let meal_API_res
    let phase2_ingredients_res

    if (image !== null && !image.startsWith('data:image')) {
      imageDataUri = `data:image/png;base64,${image}`
    }
    if (image2 !== null && !image2.startsWith('data:image')) {
      imageDataUriphase2 = `data:image/png;base64,${image2}`
    }

    if (!image && !image2) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // if (!process.env.API_BASE_URL) {
    //   throw new Error('API base URL is not defined in the environment variables')
    // }

    async function getActivePrompts(category: string) {
      try {
        const payload = await getPayload({ config: configPromise })

        const prompts = await payload.find({
          collection: 'text-extract-prompts' as const,
          where: {
            category: { equals: category },
            promptType: { equals: PromptType.USER },
          },
        })

        return prompts.docs.map((prompt) => ({
          role: prompt.promptType as PromptType,
          content: prompt.content as string,
        }))
      } catch (error) {
        console.error('Error fetching active prompts:', error)
        return []
      }
    }

    const mealSuggestionPrompt = await getActivePrompts('Extract meal suggestion table data')
    const IngredientsPrompt = await getActivePrompts('Extract Ingredients data')

    if (image !== null && imageDataUri && image2 === null) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract meal suggestions.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: mealSuggestionPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUri,
              },
            },
          ],
        },
        ...(context || []),
      ]

      const ingredientPrompt = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract ingredients.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: IngredientsPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUri },
            },
          ],
        },
        ...(context || []),
      ]

      const [mealResponse, ingredientResponse] = await Promise.all([
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 1,
          max_tokens: 10000,
        }),
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages: ingredientPrompt,
          temperature: 1,
          max_tokens: 10000,
        }),
      ])

      const mealData = JSON.parse(mealResponse?.choices[0]?.message?.content || '{}')
      ingredientData = JSON.parse(ingredientResponse?.choices[0]?.message?.content || '{}')

      const mealDataBody = {
        name: 'Meal Suggestions',
        user: userid,
        Breakfasts: mealData?.Breakfasts,
        Lunches: mealData?.Lunches,
        Dinners: mealData?.Dinners,
      }

      const mealSuggestionResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-meal-suggestion-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mealData: mealDataBody,
            userid,
          }),
        },
      )

      meal_API_res = await mealSuggestionResponse.json()

      const phase2IngredientsResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-phase2-ingredients`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredientData,
            userid,
          }),
        },
      )

      phase2_ingredients_res = await phase2IngredientsResponse.json()
    }

    if (image === null && image2 !== null && imageDataUriphase2) {
      const ingredientPromptPhase2 = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract ingredients.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: IngredientsPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUriphase2 },
            },
          ],
        },
        ...(context || []),
      ]

      const [ingredientResponsePhase2] = await Promise.all([
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages: ingredientPromptPhase2,
          temperature: 1,
          max_tokens: 10000,
        }),
      ])

      const ingredientDataPhase2 = JSON.parse(
        ingredientResponsePhase2?.choices[0]?.message?.content || '{}',
      )

      console.log(ingredientDataPhase2)

      const phase2IngredientsResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-phase2-ingredients-data-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredientData: ingredientDataPhase2,
            userid,
          }),
        },
      )

      phase2_ingredients_res = await phase2IngredientsResponse.json()
    }

    if (image !== null && image2 !== null && imageDataUri && imageDataUriphase2) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract meal suggestions.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: mealSuggestionPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUri,
              },
            },
          ],
        },
        ...(context || []),
      ]

      const ingredientPrompt = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract ingredients.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: IngredientsPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUri },
            },
          ],
        },
        ...(context || []),
      ]

      const [mealResponse, ingredientResponse] = await Promise.all([
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 1,
          max_tokens: 10000,
        }),
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages: ingredientPrompt,
          temperature: 1,
          max_tokens: 10000,
        }),
      ])

      const mealData = JSON.parse(mealResponse?.choices[0]?.message?.content || '{}')
      ingredientData = JSON.parse(ingredientResponse?.choices[0]?.message?.content || '{}')

      const mealDataBody = {
        name: 'Meal Suggestions',
        user: userid,
        Breakfasts: mealData?.Breakfasts,
        Lunches: mealData?.Lunches,
        Dinners: mealData?.Dinners,
      }

      const ingredientPromptPhase2 = [
        {
          role: 'system',
          content:
            'You are a helpful assistant trained to process meal-related images and extract ingredients.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: IngredientsPrompt[0]?.content,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUriphase2 },
            },
          ],
        },
        ...(context || []),
      ]

      const [ingredientResponsePhase2] = await Promise.all([
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages: ingredientPromptPhase2,
          temperature: 1,
          max_tokens: 10000,
        }),
      ])

      const ingredientDataPhase2 = JSON.parse(
        ingredientResponsePhase2?.choices[0]?.message?.content || '{}',
      )

      ingredientData.ingredients = [
        ...(ingredientData.ingredients || []),
        ...(ingredientDataPhase2.ingredients || []),
      ]

      const mealSuggestionResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-meal-suggestion-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mealData: mealDataBody,
            userid,
          }),
        },
      )

      meal_API_res = await mealSuggestionResponse.json()

      const phase2IngredientsResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-phase2-ingredients`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredientData,
            userid,
          }),
        },
      )

      phase2_ingredients_res = await phase2IngredientsResponse.json()
    }

    return NextResponse.json({
      meal_suggestion_message: meal_API_res?.message,
      phase_2_ingredients_message: phase2_ingredients_res?.message,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 400 })
  }
}
