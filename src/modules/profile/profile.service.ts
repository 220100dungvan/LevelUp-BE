import { Injectable, NotFoundException } from '@nestjs/common'
import { ProfileRepository } from './profile.repo'

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
}
