import type { CollectionConfig } from 'payload'

export const NotificationsList: CollectionConfig = {
  slug: 'notifications-list',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['userId', 'title', 'message', 'createdAt', 'read', 'displayTime'],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'notificationType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Breakfast Reminder',
          value: 'breakfast',
        },
        {
          label: 'Lunch Reminder',
          value: 'lunch',
        },
        {
          label: 'Dinner Reminder',
          value: 'dinner',
        },
        {
          label: 'Weekly Plan',
          value: 'weekly_plan',
        },
        {
          label: 'Achievement',
          value: 'achievement',
        },
      ],
    },
    {
      name: 'displayTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
}
