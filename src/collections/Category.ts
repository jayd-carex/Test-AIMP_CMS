import { CollectionConfig } from 'payload'

const Category: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Category Name',
      required: true,
    },
    {
      name: 'subcategories',
      type: 'array',
      label: 'Subcategories',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Subcategory Name',
          required: true,
        },
      ],
    },
  ],
}

export default Category
