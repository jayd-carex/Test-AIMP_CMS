import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import OpenAI from 'openai'
import { PromptType } from '@/collections/AIPrompts'

interface Message {
  role: string
  content: string
}

interface Ingredient {
  name: string
  quantity: number
  unit: string
}

interface MealIngredient {
  quantity?: string | null
  measureType?: string | null
  name: string
  id?: string | null
}

interface Meal {
  proteinIngredients?: MealIngredient[] | null
  carbohydrateIngredients?: MealIngredient[] | null
  id?: string | null
}

interface MealSuggestion {
  name: string
  Breakfasts?: Meal[] | null
  Lunches?: Meal[] | null
  Dinners?: Meal[] | null
}

let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://oai.helicone.ai/v1',
    defaultHeaders: {
      'Helicone-Auth': 'Bearer sk-helicone-eu-vwki52a-fgzecqy-uwweosa-cbq76sq',
    },
  })
}

async function getExistingVectorStoreId(): Promise<string> {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'open-ai-vector-file',
      limit: 1,
    })

    if (result.docs.length > 0) {
      return result.docs[0].vectorStoreId
    }

    return ''
  } catch (error) {
    return ''
  }
}

async function getActivePrompts() {
  try {
    const payload = await getPayload({ config: configPromise })
    const prompts = await payload.find({
      collection: 'ai-prompts' as const,
      where: { isActive: { equals: true } },
      sort: 'order',
      limit: 10,
    })
    return prompts.docs.map((prompt) => ({
      role: prompt.promptType as PromptType,
      content: prompt.content as string,
    }))
  } catch (error) {
    return []
  }
}

async function getCommonIngredients() {
  const payload = await getPayload({ config: configPromise })

  const ingredients = await payload.find({
    collection: 'ingredients' as const,
    where: {
      isCommon: { equals: true },
      isActive: { equals: true },
    },
  })

  return ingredients.docs.map((ing) => ing.name)
}

async function getMealSuggestions(userIdOrEmail: string) {
  const payload = await getPayload({ config: configPromise })

  const mealSuggestions = await payload.find({
    collection: 'meal-suggestions' as const,
    where: userIdOrEmail?.includes('@')
      ? { 'user.email': { equals: userIdOrEmail } }
      : { user: { equals: userIdOrEmail } },
    limit: 1,
    sort: 'name',
  })

  return mealSuggestions.docs
}

async function getUserDetails(userIdOrEmail: string) {
  const payload = await getPayload({ config: configPromise })

  const user = await payload.find({
    collection: 'users' as const,
    where: userIdOrEmail?.includes('@') // Check if it's an email
      ? { email: { equals: userIdOrEmail } } // If it's an email, search by email
      : { id: { equals: userIdOrEmail } }, // If it's not an email, search by id
    limit: 1, // Only get one record (user)
  })

  return user.docs[0].AiRememberConversation
}

async function getPhase2Ingredients(userIdOrEmail: string) {
  const payload = await getPayload({ config: configPromise })

  const P2I = await payload.find({
    collection: 'phase-2-ingredients' as const,
    where: userIdOrEmail?.includes('@')
      ? { 'user.email': { equals: userIdOrEmail } }
      : { user: { equals: userIdOrEmail } },
    sort: 'name',
  })

  const itemNames: string[] = []

  P2I?.docs[0]?.categories?.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.exclude) {
        itemNames.push(item.name)
      }
    })
  })

  return itemNames
}

async function getUserResponseId(userIdOrEmail: string) {
  const payload = await getPayload({ config: configPromise })

  const responseID = await payload.find({
    collection: 'chat-threads' as const,
    where: userIdOrEmail?.includes('@')
      ? { 'user.email': { equals: userIdOrEmail } }
      : { user: { equals: userIdOrEmail } },
    sort: 'name',
  })

  return responseID?.docs[0]?.previousResponseId
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin') ?? '*'

  try {
    const body = await req.json()
    const message = body.message
    const context = body.context ?? []
    const userId = body.userId
    const userEmail = body.userEmail
    const payloadUserId = body.payloadUserId
    const AiRememberConversation = body.AiRememberConversation
    let filteredIngredients: Ingredient[] | undefined

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const [
      activePrompts,
      commonIngredients,
      mealSuggestions,
      P2Ingredients,
      userPreviousResponseID,
      userData,
    ] = await Promise.all([
      getActivePrompts(),
      getCommonIngredients(),
      getMealSuggestions(payloadUserId),
      getPhase2Ingredients(payloadUserId),
      getUserResponseId(payloadUserId),
      getUserDetails(payloadUserId),
    ])

    let mealSuggestionText = ''

    if (mealSuggestions && mealSuggestions.length > 0) {
      mealSuggestionText = 'Use the following meal suggestion guidance when creating recipes:\n'

      mealSuggestions.forEach((suggestion: MealSuggestion, index: number) => {
        mealSuggestionText += `\nSuggestion ${index + 1} (${suggestion.name}):\n`

        const addIngredients = (mealType: string, mealArray: Meal[]) => {
          mealSuggestionText += `${mealType}:\n`
          mealArray?.forEach((meal: Meal, mealIndex: number) => {
            mealSuggestionText += `  Variation ${mealIndex + 1}:\n`

            meal.proteinIngredients?.forEach((item: MealIngredient) => {
              mealSuggestionText += `    Protein: ${item.quantity ?? '-'} ${item.measureType ?? ''} ${item.name}\n`
            })

            meal.carbohydrateIngredients?.forEach((item: MealIngredient) => {
              const quantityStr = item.quantity ? `${item.quantity} ${item.measureType ?? ''}` : ''
              mealSuggestionText += `    Carbohydrate: ${quantityStr} ${item.name}\n`
            })
          })
        }

        addIngredients('Breakfast', suggestion?.Breakfasts || [])
        addIngredients('Lunch', suggestion?.Lunches || [])
        addIngredients('Dinner', suggestion?.Dinners || [])
      })
    } else {
      mealSuggestionText = 'No meal suggestion guidance available, create recipe normally.'
    }

    const lastUserMessage = Array.isArray(body.message)
      ? body.message.filter((msg: Message) => msg.role === 'user').pop()?.content || ''
      : body.message || ''

    const ingredientNames = Array.isArray(P2Ingredients) ? P2Ingredients.join(', ') : ''

    const userInput = {
      role: 'user',
      content: message,
    }

    const isRecipeRequest =
      lastUserMessage.toLowerCase().includes('recipe') ||
      lastUserMessage.toLowerCase().includes('meal') ||
      lastUserMessage.toLowerCase().includes('cook') ||
      lastUserMessage.toLowerCase().includes('prepare')

    if (isRecipeRequest && (!P2Ingredients || P2Ingredients.length === 0)) {
      return NextResponse.json(
        {
          error:
            'I cannot create a meal suggestion at this time. Please provide a list of ingredients to help me create a recipe that aligns with your Metabolic Balance program.',
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    if (P2Ingredients && isRecipeRequest) {
      if (!Array.isArray(P2Ingredients)) {
        return NextResponse.json(
          { error: 'Ingredients must be provided as an array' },
          { status: 400 },
        )
      }

      if (P2Ingredients.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one ingredient' },
          { status: 400 },
        )
      }
    }

    const promptsWithReplacements = activePrompts.map(({ role, content }) => {
      const replacedContent = content
        .replace(/{{filteredIngredients}}/g, ingredientNames)
        .replace(/{{commonIngredients}}/g, commonIngredients.join(', '))
        .replace(/{{mealSuggestionText}}/g, mealSuggestionText)
      return { role, content: replacedContent }
    })

    const messages = [...promptsWithReplacements, ...context, userInput]

    const payload = await getPayload({ config: configPromise })

    const models = await payload.find({
      collection: 'openai-models',
      where: { isActive: { equals: true } },
      limit: 1,
    })

    const activeModel = models.docs[0]?.modelName || 'gpt-4o-mini'

    const parameterResult = await payload.find({
      collection: 'openai-parameters',
      limit: 1,
      sort: '-createdAt',
    })

    const activeParams = parameterResult.docs[0]

    const temperature = activeParams?.temperature || 1
    const maxOutputTokens = activeParams?.maxTokens || 1000
    const topP = activeParams?.topP || 1

    const vectorStoreId = await getExistingVectorStoreId()

    const usageRecord = await payload.find({
      collection: 'open-ai-token-usages',
      where: {
        and: [{ userId: { equals: userId } }],
      },
      limit: 1,
    })

    const userTokenUsed = usageRecord?.docs?.[0]?.tokenUsed ?? 0
    const userTokenLimit = usageRecord?.docs?.[0]?.monthlyTokenLimit ?? 0

    if (userTokenUsed !== 0 && userTokenLimit !== 0 && userTokenUsed >= userTokenLimit) {
      return NextResponse.json(
        {
          error: `You've reached your monthly limit. We'll be ready with more when your next cycle begins!`,
        },
        {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const responseOptions: any = {
      model: activeModel,
      input: messages,
      temperature: temperature,
      max_output_tokens: maxOutputTokens,
      top_p: topP,
      store: true,
      stream: true,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [vectorStoreId],
        },
      ],
    }

    if (userData === 'ON') {
      if (userPreviousResponseID && userPreviousResponseID !== '') {
        responseOptions.previous_response_id = userPreviousResponseID
      }
    }

    const response = await openai!.responses.create(responseOptions)

    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController) {
        try {
          let totalTokens = 0
          for await (const chunk of response as any) {
            if (chunk.type === 'response.output_text.delta') {
              const delta = chunk.delta || ''

              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text: delta })}\n\n`),
              )
            }

            if (chunk.type === 'response.output_text.done') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            }

            if (chunk.type === 'response.completed') {
              console.log(chunk, 'chunk------------')
              totalTokens = chunk?.response?.usage?.total_tokens ?? 0
              const newResponseId = chunk?.response?.id
              const now = new Date()
              const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now)
              const year = now.getFullYear()

              const tokenSettings = await payload.findGlobal({
                slug: 'token-settings',
              })

              const existing = await payload.find({
                collection: 'open-ai-token-usages',
                where: {
                  and: [{ userId: { equals: userId } }],
                },
                limit: 1,
              })

              if (existing.docs.length > 0) {
                await payload.update({
                  collection: 'open-ai-token-usages',
                  id: existing.docs[0].id,
                  data: {
                    month,
                    year,
                    tokenUsed: existing.docs[0].tokenUsed + totalTokens,
                  },
                })
              } else {
                await payload.create({
                  collection: 'open-ai-token-usages',
                  data: {
                    userId,
                    userEmail,
                    month,
                    year,
                    tokenUsed: totalTokens,
                    monthlyTokenLimit: tokenSettings?.monthlyTokenLimit,
                  },
                })
              }

              const existingThread = await payload.find({
                collection: 'chat-threads',
                where: {
                  user: { equals: payloadUserId },
                },
                limit: 1,
              })

              if (existingThread.docs.length > 0) {
                // Update it
                await payload.update({
                  collection: 'chat-threads',
                  id: existingThread.docs[0].id,
                  data: {
                    previousResponseId: newResponseId,
                  },
                })
              } else {
                // Create new entry
                await payload.create({
                  collection: 'chat-threads',
                  data: {
                    user: payloadUserId,
                    previousResponseId: newResponseId,
                  },
                })
              }
              break
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': origin,
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    )
  }
}
