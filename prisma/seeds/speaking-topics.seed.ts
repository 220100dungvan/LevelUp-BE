import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const sampleSpeakingTopics = [
  { name: 'Daily Conversation' },
  { name: 'TOEIC Speaking' },
  { name: 'Business English' },
  { name: 'Travel' },
  { name: 'IELTS Speaking' },
  { name: 'Tech' },
  { name: 'Interview Preparation' },
  { name: 'Presentations' },
]

export async function seedSpeakingTopics() {
  console.log(' Starting to seed speaking topics...')

  try {
    for (const topic of sampleSpeakingTopics) {
      const existing = await prisma.speakingTopic.findFirst({
        where: { name: topic.name },
      })

      if (!existing) {
        await prisma.speakingTopic.create({ data: { name: topic.name } })
        console.log(`Created speaking topic: ${topic.name}`)
      } else {
        console.log(`Speaking topic already exists: ${topic.name}`)
      }
    }

    console.log('Speaking topics seeded successfully!')
  } catch (error) {
    console.error('Error seeding speaking topics:', error)
    throw error
  }
}
