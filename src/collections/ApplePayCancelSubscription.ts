import type { CollectionConfig } from 'payload'

export const ApplePayCancelSubscription: CollectionConfig = {
  slug: 'apple-pay-cancel-subscription',
  admin: {
    useAsTitle: 'userId',
    defaultColumns: ['userId', 'productId', 'cancelTime'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
    },
    {
      name: 'productId',
      type: 'text',
      required: true,
    },
    {
      name: 'cancelTime',
      type: 'date',
      required: true,
    },
  ],
}
