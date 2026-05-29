import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { BreakdownResDTO, TodayProgressResDTO, WeeklyActivityResDTO } from '@/modules/dashboard/dashboard.dto'
import { DashboardService } from '@/modules/dashboard/dashboard.service'
import { Controller, Get } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('today-progress')
  @ZodResponse({ type: TodayProgressResDTO })
  getTodayProgress(@ActiveUser('userId') userId: string) {
    return this.dashboardService.getTodayProgress(userId)
  }

  @Get('breakdown')
  @ZodResponse({ type: BreakdownResDTO })
  getBreakdown(@ActiveUser('userId') userId: string) {
    return this.dashboardService.getBreakdown(userId)
  }

  @Get('weekly-activity')
  @ZodResponse({ type: WeeklyActivityResDTO })
  getWeeklyActivity(@ActiveUser('userId') userId: string) {
    return this.dashboardService.getWeeklyActivity(userId)
  }
}
