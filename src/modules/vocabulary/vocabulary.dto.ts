import {
  AddItemsToListResSchema,
  CreateVocabularyBodySchema,
  CreateVocabularyListBodySchema,
  CreateVocabularyListResSchema,
  CreateVocabularyResSchema,
  CreateVocabularyTopicBodySchema,
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
  UpdateVocabularyTopicBodySchema,
  VocabularyTopicSchema,
  SearchVocabularyResSchema,
  SearchVocabularyQuerySchema,
  AddNewVocabularyToListBodySchema,
  AddItemsByIdsBodySchema,
  GetWordsAdminQuerySchema,
  GetWordsAdminResSchema,
  UpdateVocabularyBodySchema,
  DeleteVocabularyResSchema,
  VocabularyWordsStatsSchema,
} from '@/modules/vocabulary/vocabulary.schema'
import { createZodDto } from 'nestjs-zod'

export class GetTopicsResDTO extends createZodDto(GetTopicsResSchema) {}

export class CreateVocabularyTopicBodyDTO extends createZodDto(CreateVocabularyTopicBodySchema) {}

export class UpdateVocabularyTopicBodyDTO extends createZodDto(UpdateVocabularyTopicBodySchema) {}

export class VocabularyTopicDTO extends createZodDto(VocabularyTopicSchema) {}

export class GetListsQueryDTO extends createZodDto(GetListsQuerySchema) {}

export class GetListsResDTO extends createZodDto(GetListsResSchema) {}

export class GetListDetailResDTO extends createZodDto(GetListDetailResSchema) {}

export class CreateVocabularyListBodyDTO extends createZodDto(CreateVocabularyListBodySchema) {}

export class CreateVocabularyListResDTO extends createZodDto(CreateVocabularyListResSchema) {}

export class UpdateVocabularyListBodyDTO extends createZodDto(UpdateVocabularyListBodySchema) {}

export class DeleteVocabularyListResDTO extends createZodDto(DeleteVocabularyListResSchema) {}

export class AddItemsToListResDTO extends createZodDto(AddItemsToListResSchema) {}

export class ReorderItemsBodyDTO extends createZodDto(ReorderItemsBodySchema) {}

export class CreateVocabularyResDTO extends createZodDto(CreateVocabularyResSchema) {}

export class CreateVocabularyBodyDTO extends createZodDto(CreateVocabularyBodySchema) {}

export class SubmitLearningWordBodyDTO extends createZodDto(SubmitLearningWordBodySchema) {}

export class SubmitLearningWordResDTO extends createZodDto(SubmitLearningWordResSchema) {}

export class GetLearningProgressOverviewQueryDTO extends createZodDto(GetLearningProgressOverviewQuerySchema) {}

export class GetLearningProgressOverviewResDTO extends createZodDto(GetLearningProgressOverviewResSchema) {}

export class GetLearningProgressByListResDTO extends createZodDto(GetLearningProgressByListResSchema) {}

export class SearchVocabularyQueryDTO extends createZodDto(SearchVocabularyQuerySchema) {}

export class SearchVocabularyResDTO extends createZodDto(SearchVocabularyResSchema) {}

export class AddNewVocabularyToListBodyDTO extends createZodDto(AddNewVocabularyToListBodySchema) {}

export class AddItemsByIdsBodyDTO extends createZodDto(AddItemsByIdsBodySchema) {}

export class GetWordsAdminQueryDTO extends createZodDto(GetWordsAdminQuerySchema) {}

export class GetWordsAdminResDTO extends createZodDto(GetWordsAdminResSchema) {}

export class UpdateVocabularyBodyDTO extends createZodDto(UpdateVocabularyBodySchema) {}

export class DeleteVocabularyResDTO extends createZodDto(DeleteVocabularyResSchema) {}

export class VocabularyWordsStatsDTO extends createZodDto(VocabularyWordsStatsSchema) {}
