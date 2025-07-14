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
    const { image3, userid, context } = body

    let imageDataUriphase3 = image3 || null

    if (image3 !== null && !image3.startsWith('data:image')) {
      imageDataUriphase3 = `data:image/png;base64,${image3}`
    }

    if (!image3) {
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

    const IngredientsPrompt = await getActivePrompts('Extract Ingredients data')

    let phase3_ingredients_res
    if (image3 !== null && imageDataUriphase3) {
      const ingredientPromptPhase3 = [
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
              image_url: { url: imageDataUriphase3 },
            },
          ],
        },
        ...(context || []),
      ]

      const [ingredientResponsePhase3] = await Promise.all([
        openai?.chat.completions.create({
          model: 'gpt-4o',
          messages: ingredientPromptPhase3,
          temperature: 1,
          max_tokens: 10000,
        }),
      ])

      const ingredientDataPhase3 = JSON.parse(
        ingredientResponsePhase3?.choices[0]?.message?.content || '{}',
      )

      const phase3IngredientsResponse = await fetch(
        `https://test-aimp-cms.vercel.app/api/import-phase3-ingredients`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredientData: ingredientDataPhase3,
            userid,
          }),
        },
      )

      phase3_ingredients_res = await phase3IngredientsResponse.json()
    }

    return NextResponse.json({
      phase_3_ingredients_message: phase3_ingredients_res?.message,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 400 })
  }
}
