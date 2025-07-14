import { CollectionConfig } from 'payload'

const OpenAIVectorFile: CollectionConfig = {
  slug: 'open-ai-vector-file',
  access: {
    create: ({ req: { user } }) => user?.role === 'admin',
    read: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'fileName',
      type: 'text',
      required: true,
    },
    {
      name: 'fileId',
      type: 'text',
      required: true,
    },
    {
      name: 'vectorStoreId',
      type: 'text',
      required: true,
    },
  ],
}

export default OpenAIVectorFile
