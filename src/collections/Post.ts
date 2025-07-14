import type { CollectionConfig, CollectionSlug } from 'payload'

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'author', 'createdAt', 'likesCount'],
  },
  access: {
    create: () => true, // Anyone can create a post
    read: () => true, // Anyone can read posts
    update: async ({ req: { user, payload }, id }) => {
      if (!user || !id) return false
      const post = await payload.findByID({
        collection: 'posts' as CollectionSlug,
        id,
      })
      // Cast post to include author field since we know it exists
      const typedPost = post as { author: { email: string } }
      return typeof typedPost.author === 'object' && typedPost.author.email === user.email
    },
    delete: async ({ req: { user, payload }, id }) => {
      if (!user || !id) return false
      const post = await payload.findByID({
        collection: 'posts' as CollectionSlug,
        id,
      })
      // Cast post to include author field since we know it exists
      const typedPost = post as { author: { email: string } }
      return typeof typedPost.author === 'object' && typedPost.author.email === user.email
    },
  },
  fields: [
    {
      name: 'content',
      type: 'text',
      required: false,
      label: 'Post Content',
      unique: false, // Explicitly set to false since content can be repeated
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'likesCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'likes',
      type: 'relationship',
      relationTo: 'likes',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Likes on this post',
      },
    },
    {
      name: 'commentsCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'comments',
      type: 'relationship',
      relationTo: 'comments',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Comments on this post',
      },
    },
  ],
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

                if (
                  notificationDoc.communityPostNotification &&
                  userDoc.userFirebaseToken &&
                  userDoc.email !== doc.author.email
                ) {
                  const message = {
                    to: userDoc.userFirebaseToken,
                    title: 'AiMP',
                    body: doc.author.firstName
                      ? `${doc.author.firstName} has posted in the AI Meal Planner community`
                      : "There's a new post in the AI Meal Planner Community",
                    data: {
                      type: 'Community_post_created',
                      postId: doc.id,
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
  //         try {
  //           const user = await req.payload.find({
  //             collection: 'users',
  //             where: {
  //               email: {
  //                 equals: doc.author.email,
  //               },
  //             },
  //           })

  //           if (user.docs.length > 0) {
  //             const userDoc = user.docs[0]

  //             if (userDoc.userFirebaseToken) {
  //               try {
  //                 const message = {
  //                   to: userDoc.userFirebaseToken,
  //                   title: 'AiMP',
  //                   body: `${userDoc.firstName} has posted in the AI Meal Planner community`,
  //                   data: {
  //                     type: 'meal_plan_update',
  //                     planId: doc.id,
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

  //                 await response.json()
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
  timestamps: true, // Adds createdAt and updatedAt fields
}

export default Posts
