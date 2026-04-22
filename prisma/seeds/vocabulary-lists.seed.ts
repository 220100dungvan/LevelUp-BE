import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient, UserRole, UserStatus } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcrypt'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const seedTeacher = {
  email: 'seed.teacher@levelup.test',
  password: 'LevelUp@123',
  fullName: 'Seed Teacher',
}

const sampleLists = [
  {
    topicName: 'Business English',
    name: 'Business Essentials',
    description: 'Core vocabulary for meetings, emails, and workplace communication.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Travel & Tourism',
    name: 'Travel Essentials',
    description: 'Useful words and phrases for trips, hotels, and transport.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Daily Conversation',
    name: 'Everyday Conversation',
    description: 'Common expressions for chatting in daily situations.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Technology',
    name: 'Tech Vocabulary',
    description: 'Essential terms for software, devices, and the digital world.',
    level: 'INTERMEDIATE' as const,
  },
  {
    topicName: 'Health & Medical',
    name: 'Health Vocabulary',
    description: 'Vocabulary used in hospitals, clinics, and health contexts.',
    level: 'INTERMEDIATE' as const,
  },
  {
    topicName: 'Academic English',
    name: 'Academic Study Words',
    description: 'Words and phrases useful for essays, lectures, and research.',
    level: 'INTERMEDIATE' as const,
  },
  {
    topicName: 'Entertainment',
    name: 'Entertainment Vocabulary',
    description: 'Vocabulary for movies, music, shows, and leisure activities.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Food & Cooking',
    name: 'Food and Cooking Words',
    description: 'Common words for ingredients, recipes, and kitchen actions.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Sports',
    name: 'Sports Vocabulary',
    description: 'Words related to games, fitness, and sporting events.',
    level: 'BEGINNER' as const,
  },
  {
    topicName: 'Environment',
    name: 'Environment Vocabulary',
    description: 'Vocabulary about nature, sustainability, and climate topics.',
    level: 'INTERMEDIATE' as const,
  },
]

async function seedTeacherUser() {
  const existingUser = await prisma.user.findFirst({
    where: { email: seedTeacher.email },
  })

  if (existingUser) {
    return existingUser
  }

  const password = await hash(seedTeacher.password, 10)

  return prisma.user.create({
    data: {
      email: seedTeacher.email,
      password,
      fullName: seedTeacher.fullName,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
  })
}

export async function seedVocabularyLists() {
  console.log('Starting to seed vocabulary lists...')

  try {
    const teacher = await seedTeacherUser()

    for (const list of sampleLists) {
      const topic = await prisma.vocabularyTopic.findFirst({
        where: { name: list.topicName, deletedAt: null },
      })

      if (!topic) {
        console.log(`Skipped list for missing topic: ${list.topicName}`)
        continue
      }

      const existingList = await prisma.vocabularyList.findFirst({
        where: {
          topicId: topic.id,
          name: list.name,
          createdBy: teacher.id,
          deletedAt: null,
        },
      })

      if (existingList) {
        console.log(`List already exists: ${list.name}`)
        continue
      }

      await prisma.vocabularyList.create({
        data: {
          topicId: topic.id,
          name: list.name,
          description: list.description,
          level: list.level,
          isPublic: true,
          createdBy: teacher.id,
        },
      })

      console.log(`Created list: ${list.name}`)
    }

    console.log('Vocabulary lists seeded successfully!')
  } catch (error) {
    console.error('Error seeding vocabulary lists:', error)
    throw error
  }
}
