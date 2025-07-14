import { CollectionConfig } from 'payload'

export const TrainingPosts: CollectionConfig = {
  slug: 'training-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedDate', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'comments',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'likes',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'draft',
      required: true,
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc.author) {
          try {
            const users = await req.payload.find({
              collection: 'users',
              where: {},
            })

            for (const userDoc of users.docs) {
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

                if (notificationDoc.trainingPostNotification && userDoc.userFirebaseToken) {
                  const message = {
                    to: userDoc.userFirebaseToken,
                    title: 'New Training Post Created',
                    body: `A new training post titled "${doc.title}" has been created!`,
                    data: {
                      type: 'training_post_created',
                      postId: doc.id,
                    },
                    sound: 'default',
                    priority: 'high',
                    _displayInForeground: true,
                  }

                  if (!process.env.NOTIFICATION_URL) {
                    throw new Error('NOTIFICATION_URL is not defined in the environment variables')
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
                } else {
                  console.log('No push token found for user:', userDoc.id)
                }
              }
            }
          } catch (error) {
            console.error('Error finding users or sending notifications:', error)
          }
        }
        return doc
      },
    ],
  },
  // hooks: {
  //   afterChange: [
  //     async ({ doc, req }) => {
  //       if (doc.author) {
  //         // Assuming the author has a notification token
  //         try {
  //           const user = await req.payload.find({
  //             collection: 'users',
  //             where: {
  //               id: {
  //                 equals: doc.author,
  //               },
  //             },
  //           })

  //           if (user.docs.length > 0) {
  //             const userDoc = user.docs[0]
  //             console.log('Found user token:', userDoc.userFirebaseToken)

  //             if (userDoc.userFirebaseToken) {
  //               try {
  //                 const message = {
  //                   to: userDoc.userFirebaseToken,
  //                   title: 'New Training Post Created',
  //                   body: `A new training post titled "${doc.title}" has been created!`,
  //                   data: {
  //                     type: 'training_post_created',
  //                     postId: doc.id,
  //                   },
  //                   sound: 'default',
  //                   priority: 'high',
  //                   _displayInForeground: true,
  //                 }

  //                 const response = await fetch('https://exp.host/--/api/v2/push/send', {
  //                   method: 'POST',
  //                   headers: {
  //                     Accept: 'application/json',
  //                     'Accept-encoding': 'gzip, deflate',
  //                     'Content-Type': 'application/json',
  //                   },
  //                   body: JSON.stringify(message),
  //                 })

  //                 const result = await response.json()
  //                 console.log('Push notification result:', result)
  //               } catch (error) {
  //                 console.error('Error sending notification:', error)
  //               }
  //             } else {
  //               console.log('No push token found for user')
  //             }
  //           }
  //         } catch (error) {
  //           console.error('Error finding user:', error)
  //         }
  //       }
  //       return doc
  //     },
  //   ],
  // },
}
