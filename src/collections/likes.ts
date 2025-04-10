import type { CollectionConfig, CollectionSlug } from 'payload'

const Likes: CollectionConfig = {
  slug: 'likes',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['post', 'user', 'createdAt', 'isLiked'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts' as CollectionSlug,
      required: true,
      admin: {
        description: 'The post that was liked',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users' as CollectionSlug,
      required: true,
      admin: {
        description: 'The user who liked the post',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      defaultValue: new Date(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'isLiked',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: 'Whether the post is currently liked',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc) return doc
        // Update the post's likesCount
        const post = await req.payload.findByID({
          collection: 'posts',
          id: doc.post,
        })
        if (post) {
          const likes = await req.payload.find({
            collection: 'likes',
            where: {
              'post.id': {
                equals: doc.post,
              },
              isLiked: {
                equals: true,
              },
            },
          })
          await req.payload.update({
            collection: 'posts',
            id: doc.post,
            data: {
              likesCount: likes.docs.length,
            },
          })
        }
        return doc
      },
    ],
  },
}

export default Likes
