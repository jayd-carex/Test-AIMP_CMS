import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import AIPrompts, { PromptType } from '@/collections/AIPrompts'

// Define allowed origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  'http://192.168.137.1:3000',
  // Add other origins as needed
]

async function getCommonIngredients() {
  const payload = await getPayload({
    config: configPromise,
  })

  const ingredients = await payload.find({
    collection: 'ingredients' as const,
    where: {
      isCommon: {
        equals: true,
      },
      isActive: {
        equals: true,
      },
    },
  })

  return ingredients.docs.map((ing) => ing.name)
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  console.log('CORS preflight request from origin:', origin)

  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  console.log('Origin not allowed:', origin)
  return new NextResponse(null, { status: 204 })
}

interface Ingredient {
  name: string
  quantity: number
  unit: string
}

interface Message {
  role: string
  content: string
}

async function getActivePrompts() {
  const payload = await getPayload({
    config: configPromise,
  })

  const prompts = await payload.find({
    collection: 'ai-prompts' as const,
    where: {
      isActive: {
        equals: true,
      },
    },
    sort: 'order',
  })

  return prompts.docs.map((prompt) => ({
    role: prompt.promptType as PromptType,
    content: prompt.content as string,
  }))
}

interface RecipeData {
  name: string
  description: string
  cookingTime: string
  ingredients: string[]
  instructions: string[]
  imageUrl?: string
}

interface StreamResponse {
  content: string
  recipe?: RecipeData
}

function parseRecipeFromContent(content: string): RecipeData | null {
  try {
    console.log('Starting recipe parsing...')

    // Look for common recipe section markers with improved name extraction
    const nameMatch =
      content.match(/(?:Recipe Name|Meal Name|Title):\s*([^\n]+)/i) ||
      content.match(/\*\*([^*\n]+)\*\*/i) || // Match text between ** **
      content.match(
        /(?:^|\n)([^:\n]+?)\n(?:Number of Servings|Preparation Time|Cooking Time|Description|Ingredients)/i,
      )
    console.log('Recipe name:', nameMatch?.[1]?.trim())

    const descriptionMatch = content.match(/Description:\s*([^\n]+)/i)
    const timeMatch = content.match(/(?:Total Time|Cooking Time|Preparation Time):\s*([^\n]+)/i)
    console.log('Cooking time:', timeMatch?.[1]?.trim())

    // Find ingredients section with improved pattern matching
    const ingredientsMatch = content.match(
      /\*\*Ingredients:\*\*\s*([\s\S]*?)(?=\*\*Instructions|\*\*Directions|\*\*Method|\*\*Steps|$)/i,
    )

    const ingredients = ingredientsMatch
      ? ingredientsMatch[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line.startsWith('-'))
          .map((line) => line.replace(/^-\s*/, '').trim())
          .filter(Boolean)
      : []
    console.log('Found ingredients:', ingredients.length)

    // Find instructions section with improved pattern matching
    const instructionsMatch = content.match(/\*\*Instructions:\*\*\s*([\s\S]*?)(?=\*\*|$)/i)

    const instructions = instructionsMatch
      ? instructionsMatch[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && /^\d+\./.test(line))
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())
          .filter((line) => line && !line.toLowerCase().includes('enjoy')) // Filter out the "Enjoy" message
      : []
    console.log('Found instructions:', instructions.length)

    // Clean up cooking time
    const cookingTime = timeMatch
      ? timeMatch[1]
          .replace(/^\*\*?\s*/, '') // Remove starting asterisks
          .replace(/\s*\*\*?$/, '') // Remove ending asterisks
          .trim()
      : 'Not specified'

    // Only return recipe data if we have at least ingredients and instructions
    if (ingredients.length > 0 && instructions.length > 0) {
      const recipe = {
        name: (nameMatch
          ? nameMatch[1].replace(/^\*\*?\s*/, '').replace(/\s*\*\*?$/, '')
          : 'Untitled Recipe'
        ).trim(),
        description: (descriptionMatch?.[1] || '').trim(),
        cookingTime,
        ingredients,
        instructions,
      }
      console.log('Successfully parsed recipe:', recipe.name)
      return recipe
    }
    console.log('No valid recipe found - missing ingredients or instructions')
    return null
  } catch (error) {
    console.error('Error parsing recipe:', error)
    return null
  }
}

async function generateRecipeImage(
  recipeName: string,
  ingredients: string[],
  instructions: string[],
): Promise<string | null> {
  try {
    console.log('Generating image for recipe:', recipeName)

    const ingredientsList = ingredients.join(', ')
    const methodSummary = instructions.slice(0, 2).join(' ') // Use first two steps to summarize the method

    const requestBody = {
      model: 'dall-e-3',
      prompt: `A professional, appetizing food photography style image of ${recipeName}. It is mandatory that you only include these ingredients: ${ingredientsList}. The dish must be prepared according to this method: ${methodSummary}. The image should be well-lit, showing the plated dish from a top-down or 45-degree angle, styled like a high-end cookbook or food magazine photo. Only show a close up of the food and the plate. Don't ever show the camera or the lighting.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    }

    console.log('Image generation request:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Image generation API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      throw new Error(
        `Image generation failed: ${response.status} - ${errorData?.error?.message || response.statusText}`,
      )
    }

    const data = await response.json()
    console.log('Image generation successful')
    return data.data[0].url
  } catch (error) {
    console.error('Error generating image:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    console.log('Received POST request from origin:', origin)

    const body = await req.json()
    const { userMessage, ingredients } = body
    let filteredIngredients: Ingredient[] | undefined

    // Log the request details
    console.log('Request body:', {
      userMessage,
      ingredients,
      timestamp: new Date().toISOString(),
    })

    // Extract the last user message if userMessage is an array
    const lastUserMessage = Array.isArray(userMessage)
      ? userMessage.filter((msg: Message) => msg.role === 'user').pop()?.content || ''
      : userMessage || ''

    // Check if this is a recipe creation request
    const isRecipeRequest =
      lastUserMessage.toLowerCase().includes('recipe') ||
      lastUserMessage.toLowerCase().includes('meal') ||
      lastUserMessage.toLowerCase().includes('cook') ||
      lastUserMessage.toLowerCase().includes('prepare')

    // If it's a recipe request but no ingredients provided
    if (isRecipeRequest && (!ingredients || ingredients.length === 0)) {
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

    // Validate ingredients if provided
    if (ingredients) {
      if (!Array.isArray(ingredients)) {
        return NextResponse.json(
          { error: 'Ingredients must be provided as an array' },
          { status: 400 },
        )
      }

      // Filter out ingredients with no name
      const validIngredients = ingredients.filter((ing) => ing.name && ing.name.trim().length > 0)

      // If no valid ingredients after filtering
      if (validIngredients.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one ingredient' },
          { status: 400 },
        )
      }

      // Use only valid ingredients for the recipe
      filteredIngredients = validIngredients
    }

    console.log('Making OpenAI API request...')

    // Get active prompts and common ingredients
    const [activePrompts, commonIngredients] = await Promise.all([
      getActivePrompts(),
      getCommonIngredients(),
    ])

    // Prepare messages array with prompts and ingredients
    const messages = [
      // Include all active prompts
      ...activePrompts,
      ...(filteredIngredients
        ? [
            {
              role: 'system',
              content: `Create a recipe using these ingredients:
${filteredIngredients.map((ing: Ingredient) => `- ${ing.name}`).join('\n')}

You can also use these common cooking ingredients if needed:
${commonIngredients.map((ing) => `- ${ing}`).join('\n')}

Format the recipe as follows:
**Recipe Name: [Name]**

**Number of Servings:** [Number]

**Preparation Time:** [Time]

**Cooking Time:** [Time]

**Total Time:** [Time]

**Ingredients:**
- [List each ingredient on a new line with a dash]

**Instructions:**
1. [First step]
2. [Next step]
[Continue with numbered steps]

Another Ambros inspired meal - made just for you 🙏🏻! 

In around 10 seconds you will see the meal card for this meal, why not add it to your favourites?`,
            },
          ]
        : []),
      // Only include the current user message, not the history
      { role: 'user', content: lastUserMessage },
    ]

    // Log message sizes for debugging
    console.log(
      'Message sizes:',
      messages.map((m) => ({
        role: m.role,
        contentLength: m.content.length,
        estimatedTokens: Math.ceil(m.content.length / 4), // Rough estimate
      })),
    )

    // Check if streaming is requested
    const acceptHeader = req.headers.get('accept') || ''
    const shouldStream = acceptHeader.includes('text/event-stream')

    if (shouldStream) {
      // Create a TransformStream to process the response
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()

      // Start the OpenAI request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API Error Response:', errorText)
        throw new Error(`Failed to get response from OpenAI: ${response.status} ${errorText}`)
      }

      // Process the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      // Start processing the stream
      const processStream = async () => {
        try {
          let accumulatedContent = ''
          let recipeFound = false // Flag to track if we've already found a recipe
          let partialLine = '' // Buffer for partial lines
          let lastRecipeIndex = -1 // Track where the last recipe ended

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            partialLine += chunk

            // Split on newlines, keeping any partial line
            const lines = partialLine.split('\n')
            // The last line might be incomplete, save it for the next chunk
            partialLine = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine) continue

              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6)
                if (data === '[DONE]') {
                  // Only try to parse recipe if we haven't found one yet
                  if (!recipeFound) {
                    // Check for duplicate recipe content
                    const recipeNameMatch = accumulatedContent.match(/\*\*Recipe Name:/g)
                    if (recipeNameMatch && recipeNameMatch.length > 1) {
                      // Find the last occurrence of "Recipe Name"
                      lastRecipeIndex = accumulatedContent.lastIndexOf('**Recipe Name:')
                      // Keep only the content up to the first recipe
                      accumulatedContent = accumulatedContent.substring(0, lastRecipeIndex)
                    }

                    const recipe = parseRecipeFromContent(accumulatedContent)
                    if (recipe) {
                      recipeFound = true
                      // Generate image for the recipe
                      const imageUrl = await generateRecipeImage(
                        recipe.name,
                        recipe.ingredients,
                        recipe.instructions,
                      )
                      if (imageUrl) {
                        recipe.imageUrl = imageUrl
                      }

                      // Append the signature line to the accumulated content
                      const signatureLine =
                        '\n\nAnother Ambros aimp inspired meal - made just for you 🙏🏻!'
                      accumulatedContent += signatureLine

                      // Send the final message with the complete recipe
                      const finalMessage = `data: ${JSON.stringify({
                        content: accumulatedContent,
                        recipe,
                      })}\n\n`
                      console.log('Sending final message to client:', {
                        content: accumulatedContent.substring(0, 100) + '...', // Log first 100 chars
                        recipe,
                      })
                      await writer.write(encoder.encode(finalMessage))
                    }
                  }
                  await writer.write(encoder.encode('data: [DONE]\n\n'))
                  await writer.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content

                    // Check if we're about to add duplicate content
                    if (!accumulatedContent.endsWith(content)) {
                      accumulatedContent += content

                      // Only send content updates if we haven't found a recipe yet
                      if (!recipeFound) {
                        const streamResponse: StreamResponse = { content }
                        const sseMessage = `data: ${JSON.stringify(streamResponse)}\n\n`
                        await writer.write(encoder.encode(sseMessage))
                      }
                    }
                  }
                } catch (e) {
                  // If it's a JSON parse error, log it but don't throw
                  // This allows us to continue processing the stream
                  if (e instanceof SyntaxError) {
                    console.log('Skipping incomplete JSON chunk')
                  } else {
                    console.error('Error parsing chunk:', e)
                  }
                }
              }
            }
          }

          // Handle any remaining partial line
          if (partialLine.trim()) {
            try {
              const trimmedLine = partialLine.trim()
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6)
                if (data !== '[DONE]') {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    accumulatedContent += content
                    if (!recipeFound) {
                      const streamResponse: StreamResponse = { content }
                      const sseMessage = `data: ${JSON.stringify(streamResponse)}\n\n`
                      await writer.write(encoder.encode(sseMessage))
                    }
                  }
                }
              }
            } catch (e) {
              console.log('Skipping incomplete final chunk')
            }
          }
        } catch (error: any) {
          console.error('Stream processing error:', error)
          const errorMessage = `data: ${JSON.stringify({ error: error?.message || 'Unknown error' })}\n\n`
          await writer.write(encoder.encode(errorMessage))
          await writer.abort(error)
        }
      }

      // Start processing the stream
      processStream().catch(console.error)

      // Return the readable stream
      console.log('Starting SSE stream response')
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    } else {
      // Non-streaming response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API Error Response:', errorText)
        throw new Error(`Failed to get response from OpenAI: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('Sending non-streaming response:', JSON.stringify(data, null, 2))
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
  } catch (error) {
    console.error('Error in Ambros AI API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Failed to communicate with OpenAI' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}
