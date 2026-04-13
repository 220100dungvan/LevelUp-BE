import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL!)
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }
}
