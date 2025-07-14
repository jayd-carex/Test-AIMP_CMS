import { CollectionConfig } from 'payload'
import OpenAI from 'openai'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import fs from 'fs'
import path from 'path'
import os from 'os'

const MetabolicKnowledgeBase: CollectionConfig = {
  slug: 'metabolic-knowledge-base',
  admin: {
    useAsTitle: 'fileName',
  },
  access: {
    create: async ({ req }) => {
      const payload = req.payload

      const existing = await payload.find({
        collection: 'metabolic-knowledge-base',
        limit: 1,
      })

      return existing.docs.length === 0 && req.user?.role === 'admin'
    },
    read: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'fileName',
      type: 'text',
      required: true,
    },
    {
      name: 'fileContent',
      type: 'textarea',
      maxLength: 60000,
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const { fileName, fileContent } = doc

        if (!process.env.OPENAI_API_KEY) {
          console.error('❌ Missing OPENAI_API_KEY, skipping OpenAI upload.')
          return
        }

        // Skip if no content change on update
        if (operation === 'update' && fileContent === previousDoc?.fileContent) {
          console.log(`ℹ️ No changes in content for "${fileName}", skipping OpenAI upload.`)
          return
        }

        const payload = await getPayload({ config: configPromise })

        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          })

          const tempFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`
          const tempFilePath = path.join(os.tmpdir(), tempFileName)

          fs.writeFileSync(tempFilePath, fileContent, 'utf-8')

          try {
            const fileStream = fs.createReadStream(tempFilePath)

            const uploaded = await openai.files.create({
              file: fileStream,
              purpose: 'assistants',
            })

            console.log(`✅ File uploaded to OpenAI: ${uploaded.id}`)

            const vectorStore = await openai.vectorStores.create({
              name: tempFileName.replace('.txt', '') + '-vector-store',
              file_ids: [uploaded.id],
            })

            console.log(`✅ Vector store created: ${vectorStore.id}`)

            // Check if metadata already exists
            const existing = await payload.find({
              collection: 'open-ai-vector-file',
              where: { fileName: { equals: fileName } },
              limit: 1,
            })

            if (existing.docs?.length > 0) {
              // Update existing metadata
              const existingId = existing.docs[0].id

              await payload.update({
                collection: 'open-ai-vector-file',
                id: existingId,
                data: {
                  fileId: uploaded.id,
                  vectorStoreId: vectorStore.id,
                },
                req,
              })

              console.log(`✅ Updated metadata in open-ai-vector-file (ID: ${existingId}).`)
            } else {
              // Create new metadata
              await payload.create({
                collection: 'open-ai-vector-file',
                data: {
                  fileName,
                  fileId: uploaded.id,
                  vectorStoreId: vectorStore.id,
                },
                req,
              })

              console.log(`✅ Created new metadata in open-ai-vector-file.`)
            }
          } finally {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath)
            }
          }
        } catch (error) {
          console.error('❌ Error uploading to OpenAI or saving metadata:', error)
        }
      },
    ],
  },
}

export default MetabolicKnowledgeBase
