import { Auth } from '@/common/decorators/auth.decorator'
import { DictionaryLookupQueryDTO, DictionaryLookupResDTO } from '@/modules/dictionary/dictionary.dto'
import { DictionaryService } from '@/modules/dictionary/dictionary.service'
import { Controller, Get, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('lookup')
  @Auth(['DictionaryAPIKey'])
  @ZodResponse({ type: DictionaryLookupResDTO })
  lookup(@Query() query: DictionaryLookupQueryDTO) {
    return this.dictionaryService.lookup(query.word)
  }
}
