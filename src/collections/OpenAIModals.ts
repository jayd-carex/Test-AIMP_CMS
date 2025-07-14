import { CollectionConfig } from 'payload'

const OpenAIModels: CollectionConfig = {
  slug: 'openai-models',
  labels: {
    singular: 'OpenAI Model',
    plural: 'OpenAI Models',
  },
  fields: [
    {
      name: 'modelName',
      type: 'text',
      required: true,
      label: 'Model Name',
      admin: {
        description: 'The OpenAI model identifier, e.g. "gpt-4o-mini"',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active Model',
      defaultValue: false,
      admin: {
        description: 'Mark this model as the active one used in the app',
      },
    },
  ],
}

export default OpenAIModels
