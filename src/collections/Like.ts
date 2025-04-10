import type { CollectionConfig } from 'payload'

const Likes: CollectionConfig = {
  slug: 'likes',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['post', 'user', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user, // Only logged in users can create likes
    read: () => true, // Anyone can read likes
    update: ({ req: { user } }) => !!user, // Only logged in users can update their likes
    delete: ({ req: { user } }) => !!user, // Only logged in users can delete their likes
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      hasMany: false,
      unique: true, // Ensures a user can only like a post once
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
  ],
  timestamps: true, // Adds createdAt and updatedAt fields
}

export default Likes
