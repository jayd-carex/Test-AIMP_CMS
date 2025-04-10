import type { CollectionConfig } from 'payload'

export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
}

const AIPrompts: CollectionConfig = {
  slug: 'ai-prompts',
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
      label: 'Prompt Name',
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
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'A brief description of what this prompt is used for',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      admin: {
        description: 'Order in which this prompt should be applied (lower numbers first)',
      },
    },
  ],
}

export default AIPrompts
