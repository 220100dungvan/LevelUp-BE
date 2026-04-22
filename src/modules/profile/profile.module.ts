import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from '@/modules/profile/profile.service'
import { ProfileRepository } from '@/modules/profile/profile.repo'

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
