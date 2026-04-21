import 'dotenv/config'
import { Pool } from 'pg'
import { hash } from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { Level, PrismaClient, UserRole, UserStatus } from '../../src/generated/prisma/client.js'
import { sampleVocabularyData } from './data/vocabulary-sample.data.js'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const seedTeacher = {
  email: 'seed.teacher@levelup.test',
  password: 'LevelUp@123',
  fullName: 'Seed Teacher',
}

const levelMap: Record<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED', Level> = {
  BEGINNER: Level.BEGINNER,
  INTERMEDIATE: Level.INTERMEDIATE,
  ADVANCED: Level.ADVANCED,
}

async function getOrCreateSeedTeacher() {
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

export async function seedVocabularies() {
  console.log('Starting to seed vocabularies and list items...')

  try {
    const teacher = await getOrCreateSeedTeacher()

    for (const item of sampleVocabularyData) {
      const list = await prisma.vocabularyList.findFirst({
        where: {
          name: item.listName,
          createdBy: teacher.id,
          deletedAt: null,
        },
      })

      if (!list) {
        console.log(`Skipped vocabulary for missing list: ${item.listName}`)
        continue
      }

      let vocabulary = await prisma.vocabulary.findFirst({
        where: {
          word: item.word,
          partOfSpeech: item.partOfSpeech ?? null,
        },
      })

      if (!vocabulary) {
        vocabulary = await prisma.vocabulary.create({
          data: {
            word: item.word,
            phonetic: item.phonetic,
            partOfSpeech: item.partOfSpeech,
            meaningVi: item.meaningVi,
            meaningEn: item.meaningEn,
            exampleEn: item.exampleEn,
            exampleVi: item.exampleVi,
            imageUrl: item.imageUrl,
            audioUrl: item.audioUrl,
            audioExampleUrl: item.audioExampleUrl,
            level: item.level ? levelMap[item.level] : null,
            createdBy: teacher.id,
          },
        })
        console.log(`Created vocabulary: ${item.word} (${item.partOfSpeech ?? 'n/a'})`)
      }

      const existingListItem = await prisma.vocabularyListItem.findUnique({
        where: {
          listId_vocabularyId: {
            listId: list.id,
            vocabularyId: vocabulary.id,
          },
        },
      })

      if (!existingListItem) {
        await prisma.vocabularyListItem.create({
          data: {
            listId: list.id,
            vocabularyId: vocabulary.id,
            orderIndex: item.orderIndex,
          },
        })
        console.log(`Added ${item.word} to list: ${item.listName}`)
      } else {
        console.log(`Vocabulary already linked: ${item.word} -> ${item.listName}`)
      }
    }

    console.log('Vocabularies and list items seeded successfully!')
  } catch (error) {
    console.error('Error seeding vocabularies:', error)
    throw error
  }
}
