import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Define allowed origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  // Add other origins as needed
]

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? ''

  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return new NextResponse(null, { status: 204 })
}

export async function GET(req: Request) {
  try {
    const origin = req.headers.get('origin') ?? ''
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const payload = await getPayload({
      config: configPromise,
    })

    const notifications = await payload.find({
      collection: 'notifications',
      where: {
        userId: {
          equals: userId,
        },
      },
    })

    if (notifications.docs.length === 0) {
      return NextResponse.json(
        { error: 'No notification settings found for this user' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      )
    }

    const settings = notifications.docs[0]

    // Format time strings to ensure HH:mm format
    const formatTimeString = (timeStr: string | undefined | null) => {
      if (!timeStr) return null

      try {
        // Remove any extra text and get just the time part
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (!timeMatch) {
          console.log('No valid time found in:', timeStr)
          return null
        }

        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])

        // Handle AM/PM if present
        if (timeStr.toLowerCase().includes('pm') && hours !== 12) {
          hours += 12
        } else if (timeStr.toLowerCase().includes('am') && hours === 12) {
          hours = 0
        }

        // Validate hours and minutes
        if (
          isNaN(hours) ||
          isNaN(minutes) ||
          hours < 0 ||
          hours > 23 ||
          minutes < 0 ||
          minutes > 59
        ) {
          console.log('Invalid time values:', { hours, minutes, originalTime: timeStr })
          return null
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } catch (error) {
        console.error('Error formatting time:', timeStr, error)
        return null
      }
    }

    // Also handle the meal time reminder differently
    const getMealTimeReminderMinutes = (reminderStr: string | undefined | null) => {
      if (!reminderStr) return '15'

      // Try to extract just the number
      const minutes = reminderStr.match(/\d+/)
      return minutes ? minutes[0] : '15'
    }

    console.log('Settings:', settings)

    const reminderSettings = {
      mealTimeReminder: getMealTimeReminderMinutes(settings.mealTimeReminder),
      breakfast: {
        enabled: Boolean(settings.breakfastReminder),
        time: formatTimeString(settings.breakfastTime),
        dishName: settings.breakDishName,
      },
      lunch: {
        enabled: Boolean(settings.lunchReminder),
        time: formatTimeString(settings.lunchTime),
        dishName: settings.lunchDishName,
      },
      dinner: {
        enabled: Boolean(settings.dinnerReminder),
        time: formatTimeString(settings.dinnerTime),
        dishName: settings.dinnerDishName,
      },
    }

    console.log('Formatted settings:', reminderSettings) // Debug log

    return NextResponse.json(reminderSettings, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
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
