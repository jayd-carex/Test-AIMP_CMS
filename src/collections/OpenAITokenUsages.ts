import { CollectionConfig } from 'payload'

const OpenAITokenUsages: CollectionConfig = {
  slug: 'open-ai-token-usages',
  admin: {
    useAsTitle: 'userEmail',
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
      name: 'userEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'month',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'tokenUsed',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'monthlyTokenLimit',
      type: 'number',
      required: true,
      defaultValue: 2000000,
    },
  ],
}

export default OpenAITokenUsages
