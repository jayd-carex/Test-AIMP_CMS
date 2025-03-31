import type { CollectionConfig } from 'payload'

export const ApplePayTransaction: CollectionConfig = {
  slug: 'apple-pay-transactions',
  admin: {
    useAsTitle: 'userId',
    defaultColumns: ['userId', 'productId', 'transactionId'],
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
    },
    {
      name: 'transactionId',
      type: 'text',
    },
    {
      name: 'planPeriod',
      type: 'text',
    },
    {
      name: 'planExpiryDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'transactionDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
