// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { TrainingPosts } from './collections/TrainingPosts'
import { Notifications } from './collections/Notifications'
import { NotificationsList } from './collections/NotificationsList'
import MealPlanNotifications from './collections/mealPlanNotification'
import Ingredients from './collections/Ingredients'
import AIPrompts from './collections/AIPrompts'
import { ApplePayTransaction } from './collections/ApplePayTransaction'
import { AppleProduct } from './collections/AppleProduct'
import { ApplePayCancelSubscription } from './collections/ApplePayCancelSubscription'
import Handcrafted from './collections/Handcrafted'

import Comments from './collections/Comments'
import Posts from './collections/Post'
import { s3Storage } from '@payloadcms/storage-s3'
import Likes from './collections/likes'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug, importMap: { baseDir: path.resolve(dirname) } },
  collections: [
    Users,
    Media,
    TrainingPosts,
    Notifications,
    NotificationsList,
    MealPlanNotifications,
    Ingredients,
    AIPrompts,
    ApplePayTransaction,
    AppleProduct,
    ApplePayCancelSubscription,
    Handcrafted,
    Comments,
    Posts,
    Likes,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: mongooseAdapter({ url: process.env.DATABASE_URI || '' }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET_NAME as string,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY as string,
          secretAccessKey: process.env.S3_SECRET_KEY as string,
        },
        region: process.env.S3_REGION as string,
        // ... Other S3 configuration
      },
    }),
    // storage-adapter-placeholder
  ],
})
