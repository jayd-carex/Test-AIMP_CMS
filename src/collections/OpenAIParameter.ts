import { CollectionConfig } from 'payload'

const OpenAIParameters: CollectionConfig = {
  slug: 'openai-parameters',
  labels: {
    singular: 'OpenAI Parameter',
    plural: 'OpenAI Parameters',
  },
  fields: [
    {
      name: 'temperature',
      type: 'number',
      required: true,
      label: 'Temperature',
      admin: {
        description: 'The temperature value (e.g., 0.7)',
      },
    },
    {
      name: 'maxTokens',
      type: 'number',
      required: true,
      label: 'Max Output Tokens',
      admin: {
        description: 'The maximum number of output tokens (e.g., 1000)',
      },
    },
    {
      name: 'topP',
      type: 'number',
      required: true,
      label: 'Top P',
      admin: {
        description: 'The top_p value (e.g., 1)',
      },
    },
  ],
}

export default OpenAIParameters
