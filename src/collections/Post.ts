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
      name: 'likeslll',
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
  ],
  timestamps: true, // Adds createdAt and updatedAt fields
}

export default Posts
