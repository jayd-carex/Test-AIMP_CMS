import type { CollectionConfig } from 'payload'

const Handcrafted: CollectionConfig = {
  slug: 'handcrafted',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'cookingTime', 'createdAt'],
    group: 'Content',
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
      label: 'User ID',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Recipe Name',
    },
    {
      name: 'ingredients',
      type: 'array',
      required: true,
      label: 'Ingredients',
      fields: [
        {
          name: 'ingredient',
          type: 'text',
          required: false,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'text',
          required: true,
        },
        {
          name: 'unit',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'method',
      type: 'array',
      required: true,
      label: 'Cooking Instructions',
      fields: [
        {
          name: 'step',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'cookingTime',
      type: 'number',
      required: true,
      label: 'Cooking Time (minutes)',
    },
    {
      name: 'imagePrompt',
      type: 'textarea',
      required: false,
      label: 'Recipe Description',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'isFavourite',
      type: 'checkbox',
      required: false,
      label: 'Is Favorite',
      defaultValue: false,
    },
  ],
  timestamps: true,
}

export default Handcrafted
