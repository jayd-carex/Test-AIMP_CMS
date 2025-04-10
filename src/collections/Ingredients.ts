import type { CollectionConfig } from 'payload'

const Ingredients: CollectionConfig = {
  slug: 'ingredients',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Ingredient Name',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Protein', value: 'protein' },
        { label: 'Vegetable', value: 'vegetable' },
        { label: 'Fruit', value: 'fruit' },
        { label: 'Grain', value: 'grain' },
        { label: 'Dairy', value: 'dairy' },
        { label: 'Spice', value: 'spice' },
        { label: 'Oil', value: 'oil' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'isCommon',
      type: 'checkbox',
      label: 'Common Ingredient',
      defaultValue: false,
      admin: {
        description: 'Check if this is a common cooking ingredient that can be used in any recipe',
      },
    },
    {
      name: 'metabolicBalanceSubstitute',
      type: 'text',
      label: 'Metabolic Balance Substitute',
      admin: {
        description: 'Suggested substitute that aligns with Metabolic Balance guidelines',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of the ingredient and its use in Metabolic Balance',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },
  ],
}

export default Ingredients
