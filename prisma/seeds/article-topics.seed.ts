import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const sampleArticleTopics = [
  {
    name: 'News & Current Events',
    description: 'Articles about current events, world news, and trending stories.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
  },
  {
    name: 'Science',
    description: 'Discoveries, research, and science explained in an accessible way.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69',
  },
  {
    name: 'Technology',
    description: 'Tech updates, product stories, and digital life.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  },
  {
    name: 'Business',
    description: 'Work, finance, markets, and professional insights.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df',
  },
  {
    name: 'Health & Wellness',
    description: 'Health, wellbeing, and practical lifestyle advice.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  },
  {
    name: 'Education',
    description: 'Learning, study skills, and educational topics.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f',
  },
  {
    name: 'Travel',
    description: 'Travel stories, cultures, and destinations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
  },
  {
    name: 'Environment',
    description: 'Nature, climate, and sustainability.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
  },
]

export async function seedArticleTopics() {
  console.log(' Starting to seed article topics...')

  try {
    for (const topic of sampleArticleTopics) {
      const existing = await prisma.articleTopic.findFirst({
        where: { name: topic.name },
      })

      if (existing) {
        console.log(`Article topic already exists: ${topic.name}`)
        continue
      }

      await prisma.articleTopic.create({
        data: {
          name: topic.name,
          description: topic.description,
          thumbnailUrl: topic.thumbnailUrl,
        },
      })

      console.log(`Created article topic: ${topic.name}`)
    }

    console.log('Article topics seeded successfully!')
  } catch (error) {
    console.error('Error seeding article topics:', error)
    throw error
  }
}
