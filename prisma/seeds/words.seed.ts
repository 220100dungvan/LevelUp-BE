import 'dotenv/config'
import { Pool } from 'pg'
import { hash } from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { Level, PartOfSpeech, PrismaClient, UserRole, UserStatus } from '../../src/generated/prisma/client.js'
import { readFileSync } from 'fs'
import { join } from 'path'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SEED_TEACHER_EMAIL = 'seed.teacher@levelup.test'
const BATCH_SIZE = 200

const CEFR_TO_LEVEL: Record<string, Level> = {
  A1: Level.BEGINNER,
  A2: Level.ELEMENTARY,
  B1: Level.INTERMEDIATE,
  B2: Level.UPPER_INTER,
  C1: Level.ADVANCED,
  C2: Level.MASTERY,
}

interface RawWord {
  value: {
    word: string
    partOfSpeech: string
    level: string
    phonetics?: { uk?: string; us?: string }
    audioUrlUk?: string
    audioUrlUs?: string
    meaningEn?: string
    meaningVi?: string
    example?: { en?: string; vi?: string }
  }
}

async function getOrCreateSeedTeacher() {
  const existing = await prisma.user.findFirst({ where: { email: SEED_TEACHER_EMAIL } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      email: SEED_TEACHER_EMAIL,
      password: await hash('LevelUp@123', 10),
      fullName: 'Seed Teacher',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
  })
}

export async function seedWords() {
  console.log('Seeding words...')

  const dataPath = join(__dirname, 'data', 'full-word-with-meanings.json')
  const rawData: RawWord[] = JSON.parse(readFileSync(dataPath, 'utf8'))

  // Kiểm tra nếu đã seed rồi thì bỏ qua
  const existingCount = await prisma.vocabulary.count({
    where: { creator: { email: SEED_TEACHER_EMAIL } },
  })

  if (existingCount >= rawData.length * 0.9) {
    console.log(`Words already seeded (${existingCount}/${rawData.length}). Skipping.`)
    return
  }

  const teacher = await getOrCreateSeedTeacher()

  const records = rawData
    .map((item) => {
      const v = item.value
      const pos = v.partOfSpeech as PartOfSpeech
      const level = CEFR_TO_LEVEL[v.level] ?? null
      const meaningVi = v.meaningVi?.trim() || v.word

      if (!pos || !meaningVi) return null

      return {
        word: v.word,
        partOfSpeech: pos,
        level,
        phoneticUk: v.phonetics?.uk ?? null,
        phoneticUs: v.phonetics?.us ?? null,
        audioUrlUk: v.audioUrlUk ?? null,
        audioUrlUs: v.audioUrlUs ?? null,
        meaningEn: v.meaningEn?.trim() || null,
        meaningVi,
        exampleEn: v.example?.en?.trim() || null,
        exampleVi: v.example?.vi?.trim() || null,
        isVerified: true,
        createdBy: teacher.id,
      }
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof records.find>>[]

  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const result = await prisma.vocabulary.createMany({
      data: batch,
      skipDuplicates: true, // bỏ qua nếu đã tồn tại (@@unique [word, partOfSpeech, meaningVi])
    })
    inserted += result.count
    console.log(`  ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} processed, ${inserted} inserted`)
  }

  console.log(`Words seeded: ${inserted} new records (${records.length - inserted} already existed).`)
}
