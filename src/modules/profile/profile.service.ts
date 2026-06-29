import { Injectable, NotFoundException } from '@nestjs/common'
import { ProfileRepository } from './profile.repo'
import { OnboardingBodyType, UpdateLevelBodyType } from '@/modules/profile/profile.schema'

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(userId: string) {
    const profile = await this.profileRepository.findProfileByUserId(userId)
    if (!profile) {
      throw new NotFoundException('Error.UserNotFound')
    }
    return profile
  }

  async completeOnboarding(userId: string, body: OnboardingBodyType) {
    const profile = await this.profileRepository.findProfileByUserId(userId)
    if (!profile) {
      throw new NotFoundException('Error.UserNotFound')
    }
    return this.profileRepository.completeOnboarding(userId, body)
  }

  async updateLevel(userId: string, body: UpdateLevelBodyType) {
    const profile = await this.profileRepository.findProfileByUserId(userId)
    if (!profile) {
      throw new NotFoundException('Error.UserNotFound')
    }
    return this.profileRepository.updateLevel(userId, body)
  }
}
