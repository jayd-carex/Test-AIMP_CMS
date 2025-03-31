import type { CollectionConfig } from 'payload'

export const AppleProduct: CollectionConfig = {
  slug: 'apple-product',
  admin: {
    useAsTitle: 'productId',
    defaultColumns: ['productId', 'referenceName', 'subscriptionDuration'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'productId',
      type: 'text',
      required: true,
    },
    {
      name: 'referenceName',
      type: 'text',
      required: true,
    },
    {
      name: 'subscriptionDuration',
      type: 'text',
      required: true,
    },
  ],
}
