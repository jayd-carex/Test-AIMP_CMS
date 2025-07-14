import type { CollectionConfig, CollectionSlug } from 'payload'

const Likes: CollectionConfig = {
  slug: 'likes',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['post', 'user', 'createdAt', 'isLiked'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
}

export default Likes
