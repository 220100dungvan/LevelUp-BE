import {
  AddItemsToListBodySchema,
  AddItemsToListResSchema,
  CreateVocabularyBodySchema,
  CreateVocabularyListBodySchema,
  CreateVocabularyListResSchema,
  CreateVocabularyResSchema,
  CreateTopicBodySchema,
  DeleteVocabularyListResSchema,
  GetLearningProgressByListResSchema,
  GetLearningProgressOverviewQuerySchema,
  GetLearningProgressOverviewResSchema,
  GetListDetailResSchema,
  GetListsQuerySchema,
  GetListsResSchema,
  GetTopicsResSchema,
  ReorderItemsBodySchema,
  SubmitLearningWordBodySchema,
  SubmitLearningWordResSchema,
  UpdateVocabularyListBodySchema,
  UpdateTopicBodySchema,
  VocabularyTopicSchema,
} from '@/modules/vocabulary/vocabulary.schema'
import { createZodDto } from 'nestjs-zod'

export class GetTopicsResDTO extends createZodDto(GetTopicsResSchema) {}

export class CreateTopicBodyDTO extends createZodDto(CreateTopicBodySchema) {}

export class UpdateTopicBodyDTO extends createZodDto(UpdateTopicBodySchema) {}

export class VocabularyTopicDTO extends createZodDto(VocabularyTopicSchema) {}

export class GetListsQueryDTO extends createZodDto(GetListsQuerySchema) {}

export class GetListsResDTO extends createZodDto(GetListsResSchema) {}

export class GetListDetailResDTO extends createZodDto(GetListDetailResSchema) {}

export class CreateVocabularyListBodyDTO extends createZodDto(CreateVocabularyListBodySchema) {}

export class CreateVocabularyListResDTO extends createZodDto(CreateVocabularyListResSchema) {}

export class UpdateVocabularyListBodyDTO extends createZodDto(UpdateVocabularyListBodySchema) {}

export class DeleteVocabularyListResDTO extends createZodDto(DeleteVocabularyListResSchema) {}

export class AddItemsToListBodyDTO extends createZodDto(AddItemsToListBodySchema) {}

export class AddItemsToListResDTO extends createZodDto(AddItemsToListResSchema) {}

export class ReorderItemsBodyDTO extends createZodDto(ReorderItemsBodySchema) {}

export class CreateVocabularyResDTO extends createZodDto(CreateVocabularyResSchema) {}

export class CreateVocabularyBodyDTO extends createZodDto(CreateVocabularyBodySchema) {}

export class SubmitLearningWordBodyDTO extends createZodDto(SubmitLearningWordBodySchema) {}

export class SubmitLearningWordResDTO extends createZodDto(SubmitLearningWordResSchema) {}

export class GetLearningProgressOverviewQueryDTO extends createZodDto(GetLearningProgressOverviewQuerySchema) {}

export class GetLearningProgressOverviewResDTO extends createZodDto(GetLearningProgressOverviewResSchema) {}

export class GetLearningProgressByListResDTO extends createZodDto(GetLearningProgressByListResSchema) {}
