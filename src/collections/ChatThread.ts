import type { CollectionConfig } from 'payload'

const ChatThread: CollectionConfig = {
  slug: 'chat-threads',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'previousResponseId',
      type: 'text',
    },
  ],
}

export default ChatThread
