import { NextRequest, NextResponse } from 'next/server'
import AWS from 'aws-sdk'

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
})

const ddb = new AWS.DynamoDB.DocumentClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, userEmail, password, stripeCheckoutSession } = body

    if (!firstName || !lastName || !userEmail || !password || !stripeCheckoutSession) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Call your signup API
    const response = await fetch(`https://base.api.dev.carex.life/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password, firstName, lastName }),
    })

    const userRegistrationResponse = await response.json()

    console.log('userRegistrationResponse', userRegistrationResponse)

    if (userRegistrationResponse.status !== 'success') {
      return NextResponse.json(
        { error: userRegistrationResponse.message, errorCode: userRegistrationResponse.errorCode },
        { status: 500 },
      )
    }

    // Insert into DynamoDB
    const userId = userRegistrationResponse.userUUID
    const defaultDayIndex = new Date().getDay()
    const dayIndex = defaultDayIndex === 0 ? 6 : defaultDayIndex - 1

    const params = {
      TableName: 'Users',
      Item: {
        UserId: userId,
        Email: userEmail,
        FirstName: firstName,
        LastName: lastName,
        StripeCustomerId: stripeCheckoutSession,
        MBPlan: [],
        PlanDay: dayIndex,
      },
    }

    console.log('params', params)

    const test = await ddb.put(params).promise()
    console.log('test', test)

    return NextResponse.json(userRegistrationResponse)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
