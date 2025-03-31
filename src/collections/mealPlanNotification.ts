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
              console.log('Found user token:', userDoc.userFirebaseToken)

              if (userDoc.userFirebaseToken) {
                try {
                  const message = {
                    to: userDoc.userFirebaseToken,
                    title: 'Meal Plan Update',
                    body: 'Your meal plan has been updated!',
                    data: {
                      type: 'meal_plan_update',
                      planId: doc.id,
                    },
                    sound: 'default',
                    priority: 'high',
                    _displayInForeground: true,
                  }

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
                  console.log('Push notification result:', result)
                } catch (error) {
                  console.error('Error sending notification:', error)
                }
              } else {
                console.log('No push token found for user')
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
