import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const categories = await payload.find({ collection: 'categories' })
    const result = categories.docs.map((cat: any) => ({
      category: cat.name,
      subCategory: Array.isArray(cat.subcategories)
        ? cat.subcategories.map((sub: any) => sub.name)
        : [],
    }))
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error?.message || 'Unknown error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  }
}
