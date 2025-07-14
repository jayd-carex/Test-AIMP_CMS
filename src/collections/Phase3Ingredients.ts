import { CollectionConfig } from 'payload'

const Phase3Ingredients: CollectionConfig = {
  slug: 'phase-3-ingredients',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
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
      name: 'categories',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'categoryName',
          type: 'text',
          required: true,
        },
        {
          name: 'items',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'quantity',
              type: 'text',
              required: false,
            },
            {
              name: 'unit',
              type: 'text',
              required: false,
            },
          ],
        },
      ],
    },
  ],
}

export default Phase3Ingredients
