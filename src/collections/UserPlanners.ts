import { CollectionConfig } from 'payload'

const UserPlanners: CollectionConfig = {
  slug: 'userplanners',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: () => true, // Anyone can create a post
    read: () => true, // Anyone can read posts
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'planner',
      type: 'json',
      required: true,
    },
  ],
  timestamps: true,
}

export default UserPlanners
