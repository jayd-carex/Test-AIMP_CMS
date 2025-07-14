import type { CollectionConfig } from 'payload'

export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
}

const TextExtractPrompts: CollectionConfig = {
  slug: 'text-extract-prompts',
  admin: {
    useAsTitle: 'category',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'category',
      type: 'text',
      required: true,
      label: 'Prompt Category',
    },
    {
      name: 'promptType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'System Prompt',
          value: PromptType.SYSTEM,
        },
        {
          label: 'User Prompt',
          value: PromptType.USER,
        },
      ],
      defaultValue: PromptType.SYSTEM,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Prompt Content',
    },
  ],
}

export default TextExtractPrompts
