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
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts' as CollectionSlug,
      required: true,
      hasMany: false,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
  ],
  timestamps: true,
}

export default Comments
