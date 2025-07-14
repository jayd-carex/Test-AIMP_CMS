import type { CollectionConfig } from 'payload'

const MealSuggestions: CollectionConfig = {
  slug: 'meal-suggestions',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'Breakfasts',
      type: 'array',
      fields: [
        {
          name: 'proteinIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'carbohydrateIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'Lunches',
      type: 'array',
      fields: [
        {
          name: 'proteinIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'carbohydrateIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'Dinners',
      type: 'array',
      fields: [
        {
          name: 'proteinIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'carbohydrateIngredients',
          type: 'array',
          fields: [
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'measureType',
              type: 'text',
              required: false,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

export default MealSuggestions
