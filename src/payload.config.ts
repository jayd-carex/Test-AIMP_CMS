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
import { ApplePayTransaction } from './collections/ApplePayTransaction'
import { AppleProduct } from './collections/AppleProduct'
import { ApplePayCancelSubscription } from './collections/ApplePayCancelSubscription'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    TrainingPosts,
    Notifications,
    NotificationsList,
    MealPlanNotifications,
    ApplePayTransaction,
    AppleProduct,
    ApplePayCancelSubscription,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
