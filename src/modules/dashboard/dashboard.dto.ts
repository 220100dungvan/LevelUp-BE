import {
  BreakdownResSchema,
  TodayProgressResSchema,
  WeeklyActivityResSchema,
} from '@/modules/dashboard/dashboard.schema'
import { createZodDto } from 'nestjs-zod'

export class TodayProgressResDTO extends createZodDto(TodayProgressResSchema) {}
export class BreakdownResDTO extends createZodDto(BreakdownResSchema) {}
export class WeeklyActivityResDTO extends createZodDto(WeeklyActivityResSchema) {}
