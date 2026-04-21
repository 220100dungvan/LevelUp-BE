import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const sampleTopics = [
  {
    name: 'Business English',
    description: 'Vocabulary and phrases for business and professional communication',
    thumbnailUrl: 'https://i.pinimg.com/736x/90/54/e2/9054e24460e723e72787a4d7274e12d3.jpg',
  },
  {
    name: 'Travel & Tourism',
    description: 'Essential words and expressions for traveling and tourism',
    thumbnailUrl: 'https://i.pinimg.com/1200x/d3/5f/b0/d35fb0124b33509fa210fee7383d05f1.jpg',
  },
  {
    name: 'Daily Conversation',
    description: 'Common phrases and vocabulary for everyday conversations',
    thumbnailUrl: 'https://i.pinimg.com/736x/f5/d0/12/f5d0121eadab5dacd9c4cfe9d55a6eb0.jpg',
  },
  {
    name: 'Technology',
    description: 'Tech-related vocabulary and terminology',
    thumbnailUrl: 'https://i.pinimg.com/1200x/bc/14/e5/bc14e59d814976cdeaf820fc39f16d17.jpg',
  },
  {
    name: 'Health & Medical',
    description: 'Medical and health-related vocabulary',
    thumbnailUrl: 'https://i.pinimg.com/736x/fa/11/d0/fa11d05275ba52485c2f964eef620f52.jpg',
  },
  {
    name: 'Academic English',
    description: 'Vocabulary for academic writing and studies',
    thumbnailUrl: 'https://i.pinimg.com/736x/05/f4/e8/05f4e8c975bef819b70fbb52e0ee8e5b.jpg',
  },
  {
    name: 'Entertainment',
    description: 'Words related to movies, music, and entertainment',
    thumbnailUrl: 'https://i.pinimg.com/736x/27/de/bf/27debfd2d9ac7a398ee4fe3ddd470d87.jpg',
  },
  {
    name: 'Food & Cooking',
    description: 'Culinary vocabulary and cooking-related words',
    thumbnailUrl: 'https://i.pinimg.com/1200x/50/fe/04/50fe048637b02c5bdf696639f823b98f.jpg',
  },
  {
    name: 'Sports',
    description: 'Sports-related vocabulary and terminology',
    thumbnailUrl: 'https://i.pinimg.com/1200x/fd/be/d5/fdbed5a7cd02721970c8145d0cf38b92.jpg',
  },
  {
    name: 'Environment',
    description: 'Environmental and nature-related vocabulary',
    thumbnailUrl: 'https://i.pinimg.com/736x/64/d8/43/64d8437e21236d3750e5b7e877b8b54a.jpg',
  },
]

export async function seedTopics() {
  console.log(' Starting to seed vocabulary topics...')

  try {
    for (const topic of sampleTopics) {
      const existing = await prisma.vocabularyTopic.findFirst({
        where: { name: topic.name },
      })

      if (!existing) {
        await prisma.vocabularyTopic.create({
          data: {
            name: topic.name,
            description: topic.description,
            thumbnailUrl: topic.thumbnailUrl,
          },
        })
        console.log(`Created topic: ${topic.name}`)
      } else {
        console.log(`Topic already exists: ${topic.name}`)
      }
    }

    console.log('Vocabulary topics seeded successfully!')
  } catch (error) {
    console.error('Error seeding topics:', error)
    throw error
  }
}
