import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { GetUserProfileResDTO, OnboardingBodyDTO, OnboardingResDTO, UpdateLevelBodyDTO } from './profile.dto'
import { ProfileService } from './profile.service'
import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodResponse({ type: GetUserProfileResDTO })
  getProfile(@ActiveUser('userId') userId: string) {
    return this.profileService.getProfile(userId)
  }

  @Patch('onboarding')
  @ZodResponse({ type: OnboardingResDTO })
  completeOnboarding(@Body() body: OnboardingBodyDTO, @ActiveUser('userId') userId: string) {
    return this.profileService.completeOnboarding(userId, body)
  }

  @Patch('level')
  @ZodResponse({ type: GetUserProfileResDTO })
  updateLevel(@Body() body: UpdateLevelBodyDTO, @ActiveUser('userId') userId: string) {
    return this.profileService.updateLevel(userId, body)
  }
}
