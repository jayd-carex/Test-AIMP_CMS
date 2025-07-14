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
    // Add admin-only login restriction
    admin: ({ req: { user } }) => {
      return Boolean((user?.role as string) === 'admin')
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
    },
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
      name: 'practitionerName',
      type: 'text',
    },
    {
      name: 'practitionerEmail',
      type: 'email',
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
      required: false,
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
    {
      name: 'lastViewedCommunity',
      type: 'date',
      required: false,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'AiRememberConversation',
      type: 'text',
      defaultValue: 'ON',
    },
  ],
}
