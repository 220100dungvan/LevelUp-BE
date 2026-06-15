import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const sampleVideoTopics = [
  {
    name: 'Daily Life',
    description: 'Everyday routines, conversations, and situations.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777054517/DATN/VideoTopics/knlcju6hgu2apqy5wtev.jpg',
  },
  {
    name: 'Travel & Tourism',
    description: 'Travel vlogs, destinations, and cultural experiences.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777055995/DATN/VideoTopics/hj7j1gyha7oqljlfhilv.jpg',
  },
  {
    name: 'Business English',
    description: 'Workplace conversations, meetings, and professional communication.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777056063/DATN/VideoTopics/yzce1v7ggjantr4o4prx.jpg',
  },
  {
    name: 'News & Current Events',
    description: 'News reports, interviews, and current affairs.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777303187/DATN/VideoTopics/b3c3kgud9cw3vyhk4wgh.jpg',
  },
  {
    name: 'Movies & TV Shows',
    description: 'Clips and scenes from movies, series, and entertainment shows.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777303359/DATN/VideoTopics/nesumhaj1blmaufsiqpi.jpg',
  },
  {
    name: 'Technology',
    description: 'Product reviews, tech talks, and digital trends.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777303453/DATN/VideoTopics/tbsayqk1glaxpxeywwod.jpg',
  },
  {
    name: 'Education',
    description: 'Lectures, tutorials, and academic discussions.',
    thumbnailUrl:
      'https://res.cloudinary.com/dcmpyg8ih/image/upload/v1777303578/DATN/VideoTopics/yqgh5pmh1hkrjv6amcag.jpg',
  },
  {
    name: 'Music & Songs',
    description: 'Song lyrics, music videos, and pronunciation practice.',
    thumbnailUrl: 'https://i.pinimg.com/736x/fc/9b/a5/fc9ba5da6bafd6ae9ed5ed0b28a7b5ab.jpg',
  },
]

export async function seedVideoTopics() {
  console.log(' Starting to seed video topics...')

  try {
    for (const topic of sampleVideoTopics) {
      const existing = await prisma.videoTopic.findFirst({
        where: { name: topic.name },
      })

      if (existing) {
        console.log(`Video topic already exists: ${topic.name}`)
        continue
      }

      await prisma.videoTopic.create({
        data: {
          name: topic.name,
          description: topic.description,
          thumbnailUrl: topic.thumbnailUrl,
        },
      })

      console.log(`Created video topic: ${topic.name}`)
    }

    console.log('Video topics seeded successfully!')
  } catch (error) {
    console.error('Error seeding video topics:', error)
    throw error
  }
}
