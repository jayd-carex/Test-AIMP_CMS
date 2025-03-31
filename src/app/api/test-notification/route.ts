import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const EXPO_PUSH_TOKEN = 'ExponentPushToken[ja68A1IXLZJ8yl8_QD1UQh]'

    const message = [
      {
        to: EXPO_PUSH_TOKEN,
        title: 'Test Notification',
        body: 'This is a test notification',
        sound: 'default',
        badge: 1, // iOS badge count
        priority: 'high',
        data: {
          experienceId: '@jaydcarex/aimp-mobile',
          scopeKey: '@jaydcarex/aimp-mobile',
          type: 'test',
        },
        // iOS specific configuration
        _category: 'myNotificationCategory', // iOS notification category
        _displayInForeground: true, // Show even when app is in foreground
        ios: {
          sound: true,
          _displayInForeground: true,
          priority: 'high',
          // Critical alerts for iOS (requires special permission)
          _critical: true,
          _criticalSound: {
            name: 'default',
            volume: 1.0,
          },
        },
        // Remove Android specific config for iOS
        // channelId: 'default',
        // android: { ... },
      },
    ]

    console.log('Sending iOS notification:', message)

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    console.log('Raw Expo response:', response)
    console.log('Expo notification result:', result)

    if (result.data?.status === 'ok') {
      console.log('Notification sent successfully to iOS device')
    } else {
      console.error('Notification might have failed:', result)
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
