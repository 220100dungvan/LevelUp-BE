import fs from 'fs'
import path from 'path'
import config from 'dotenv'
import z from 'zod'

config.config({
  path: '.env',
})

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không tìm thấy file .env')
  process.exit(1)
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  API_KEY_SECRET: z.string(),
  DICTIONARY_API_KEY_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  APP_NAME: z.string(),
  EMAIL_FROM: z.string(),
  // docker
  POSTGRES_CONTAINER_NAME: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PORT: z.string(),

  REDIS_CONTAINER_NAME: z.string(),
  REDIS_PORT: z.string(),
  REDIS_HOST: z.string(),
  REDIS_URL: z.string(),
  REDIS_URL_DOCKER: z.string(),

  APP_CONTAINER_NAME: z.string(),
  DATABASE_URL_DOCKER: z.string(),
  APP_PORT: z.string(),

  OTP_EXPIRES_IN: z.string(),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters long'),
  SERPAPI_KEY: z.string(),
  GROQ_API_KEY: z.string(),
  GROQ_CHAT_API_ENDPOINT: z.string(),
  GROQ_AUDIO_API_ENDPOINT: z.string(),
  GROQ_STT_MODEL: z.string(),
  FASTAPI_SERVER_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_VIDEO_TOPIC_FOLDER: z.string(),
  CLOUDINARY_SHADOWING_AUDIO_FOLDER: z.string(),
  CLOUDINARY_ARTICLE_AUDIO_FOLDER: z.string(),
  CLOUDINARY_ARTICLE_THUMBNAIL_FOLDER: z.string(),
  LEARNING_TOKEN_SECRET: z.string(),
  // Dictionary
  GIPHY_API_ENDPOINT: z.string(),
  GIPHY_API_KEY: z.string(),
  URBAN_DICTIONARY_API_ENDPOINT: z.string(),
  FREE_DICTIONARY_API_ENDPOINT: z.string(),
  DICTIONARY_API_ENDPOINT: z.string(),
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.log('Các giá trị khai báo trong file .env không hợp lệ')
  console.error(configServer.error)
  process.exit(1)
}

const envConfig = configServer.data
export default envConfig
