import { CollectionConfig } from 'payload'

const MealPlanNotifications: CollectionConfig = {
  slug: 'meal-plan-notifications',
  admin: {
    useAsTitle: 'userId',
    defaultColumns: ['userId', 'planLastGenerated', 'mbPlan', 'selectedPlan'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      label: 'User ID',
    },
    {
      name: 'planLastGenerated',
      type: 'date',
      required: true,
      label: 'Plan Last Generated',
    },
    {
      name: 'mbPlan',
      type: 'text',
      required: true,
      label: 'MB Plan',
    },
    {
      name: 'selectedPlan',
      type: 'text',
      required: true,
      label: 'Selected Plan',
    },
    {
      name: 'email',
      type: 'text',
      required: true,
      label: 'Email',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc.email) {
          try {
            const user = await req.payload.find({
              collection: 'users',
              where: {
                email: {
                  equals: doc.email,
                },
              },
            })

            if (user.docs.length > 0) {
              const userDoc = user.docs[0]
              const notifications = await req.payload.find({
                collection: 'notifications',
                where: {
                  userId: {
                    equals: userDoc.id,
                  },
                },
              })

              if (notifications.docs.length > 0) {
                const notificationDoc = notifications.docs[0]

                if (notificationDoc.weeklyMealPlanNotification && userDoc.userFirebaseToken) {
                  const messages = [
                    '🎉 Your new AiMP meal plan is ready — fresh recipes and smart ideas, just for you!',
                    'Chef Ai has done the work! Your personalised weekly meal plan is waiting 🍽️',
                    '✅ Planning = done. Your AI meal plan for the week has landed in AiMP!',
                    'You’ve got taste! Your customised meals for the week are now live 🎯',
                    '🥕 Fresh picks, smart meals, less stress — your plan’s ready to roll!',
                    'Let’s crush this week’s goals. Your AiMP meal plan is good to go 💪',
                    '🧠 AI just mapped your meals! Jump in and see what’s on your plate this week.',
                    'Done and dusted: your weekly meal plan is live. You’re going to love these bites!',
                    '📦 Your food game, delivered. Check out your fresh new plan in AiMP.',
                    '🍏 This week just got easier. Your personalised nutrition plan is waiting.',
                  ]

                  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

                  try {
                    const message = {
                      to: userDoc.userFirebaseToken,
                      title: 'AiMP new meal plan',
                      body: randomMessage,
                      data: {
                        type: 'meal_plan_update',
                        planId: doc.id,
                      },
                      sound: 'default',
                      priority: 'high',
                      _displayInForeground: true,
                    }
                    if (!process.env.NOTIFICATION_URL) {
                      throw new Error(
                        'NOTIFICATION_URL is not defined in the environment variables',
                      )
                    }
                    const response = await fetch(process.env.NOTIFICATION_URL, {
                      method: 'POST',
                      headers: {
                        Accept: 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(message),
                    })

                    const result = await response.json()
                    console.log('Push notification result:', result)
                  } catch (error) {
                    console.error('Error sending notification:', error)
                  }
                } else {
                  console.log('No push token found for user')
                }
              }
            }
          } catch (error) {
            console.error('Error finding user:', error)
          }
        }
        return doc
      },
    ],
  },
  timestamps: true,
}

export default MealPlanNotifications
