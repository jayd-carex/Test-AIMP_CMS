import type { CollectionConfig, CollectionSlug } from 'payload'

interface CommentDoc {
  author: string
  content: string
  post: string
}

const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'author', 'post', 'createdAt'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: ({ req: { user }, id }) => {
      if (!user) return false
      return user.id === id
    },
    delete: ({ req: { user }, id }) => {
      if (!user) return false
      return user.id === id
    },
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts' as CollectionSlug,
      required: true,
      hasMany: false,
    },
    {
      name: 'likes',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'likesCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, operation, req: { payload } }) => {
        // Update post's commentsCount
        const post = await payload.findByID({
          collection: 'posts' as CollectionSlug,
          id: doc.post,
        })

        const op = operation as 'create' | 'delete'
        if (op === 'create') {
          await payload.update({
            collection: 'posts' as CollectionSlug,
            id: doc.post,
            data: {
              commentsCount: (post as any).commentsCount || 0 + 1,
            },
          })
        } else if (op === 'delete') {
          await payload.update({
            collection: 'posts' as CollectionSlug,
            id: doc.post,
            data: {
              commentsCount: Math.max((post as any).commentsCount || 1 - 1, 0),
            },
          })
        }
      },
    ],
  },
}

export default Comments
