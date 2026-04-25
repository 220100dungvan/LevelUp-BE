import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { GetUserProfileResDTO } from './profile.dto'
import { ProfileService } from './profile.service'
import { Controller, Get } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodResponse({ type: GetUserProfileResDTO })
  getProfile(@ActiveUser('userId') userId: string) {
    return this.profileService.getProfile(userId)
  }
}
