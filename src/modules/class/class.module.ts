import { Module } from '@nestjs/common'
import { ClassController } from './class.controller'
import { ClassService } from './class.service'
import { ClassRepository } from '@/modules/class/class.repository'

@Module({
  controllers: [ClassController],
  providers: [ClassService, ClassRepository],
  exports: [ClassService],
})
export class ClassModule {}
