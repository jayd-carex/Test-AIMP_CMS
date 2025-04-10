import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'currentActivePlan',
      type: 'text',
    },
    {
      name: 'planStatus',
      type: 'text',
    },
    {
      name: 'stripeCustomerID',
      type: 'text',
      required: true,
    },
    {
      name: 'userAvatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'lastLogin',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'lastAppAccess',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
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
      name: 'DaysInARow',
      type: 'number',
      required: true,
    },
    {
      name: 'userFirebaseToken',
      type: 'text',
      required: false,
    },
  ],
}
