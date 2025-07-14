import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'productName',
    defaultColumns: ['productName', 'productId', 'price', 'priceId'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'productName',
      type: 'text',
      required: true,
    },
    {
      name: 'productId',
      type: 'text',
      required: true,
    },
    {
      name: 'price',
      type: 'text',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
    },
    {
      name: 'pricePerWeek',
      type: 'text',
      required: true,
    },
    {
      name: 'discountTag',
      type: 'text',
      required: true,
    },
    {
      name: 'priceId',
      type: 'text',
      required: true,
    },
    {
      name: 'planPeriod',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
