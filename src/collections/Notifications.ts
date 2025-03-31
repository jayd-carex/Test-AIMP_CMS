import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['userId', 'message', 'createdAt'],
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
      name: 'mealTimeReminder',
      type: 'text',
      required: false,
    },
    {
      name: 'message',
      type: 'textarea',
      required: false,
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
    {
      name: 'weeklyMealPlanNotification',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'breakfastReminder',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'lunchReminder',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'dinnerReminder',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'breakfastTime',
      type: 'text',
      required: false,
    },
    {
      name: 'breakDishName',
      type: 'text',
      required: false,
    },
    {
      name: 'lunchTime',
      type: 'text',
      required: false,
    },
    {
      name: 'lunchDishName',
      type: 'text',
      required: false,
    },
    {
      name: 'dinnerTime',
      type: 'text',
      required: false,
    },
    {
      name: 'dinnerDishName',
      type: 'text',
      required: false,
    },
  ],
  timestamps: true,
}
