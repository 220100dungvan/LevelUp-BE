import { createZodDto } from 'nestjs-zod'
import {
  AddVideoVocabulariesBodySchema,
  CreateVideoBodySchema,
  CreateVideoSentenceBodySchema,
  CreateVideoTopicBodySchema,
  GetVideoDetailResSchema,
  GetVideosQuerySchema,
  GetVideosResSchema,
  GetVideoTopicsResSchema,
  ProcessYoutubeVideoUrlBodySchema,
  ProcessYoutubeVideoUrlResSchema,
  ProcessedVideoSentenceSchema,
  UpdateVideoBodySchema,
  UpdateVideoSentenceBodySchema,
  UpdateVideoTopicBodySchema,
  VideoSentenceSchema,
  VideoTopicSchema,
} from '@/modules/video/video.schema'

export class GetVideosQueryDTO extends createZodDto(GetVideosQuerySchema) {}
export class GetVideosResDTO extends createZodDto(GetVideosResSchema) {}
export class GetVideoDetailResDTO extends createZodDto(GetVideoDetailResSchema) {}
export class GetVideoTopicsResDTO extends createZodDto(GetVideoTopicsResSchema) {}
export class VideoTopicDTO extends createZodDto(VideoTopicSchema) {}
export class CreateVideoTopicBodyDTO extends createZodDto(CreateVideoTopicBodySchema) {}
export class UpdateVideoTopicBodyDTO extends createZodDto(UpdateVideoTopicBodySchema) {}
export class CreateVideoBodyDTO extends createZodDto(CreateVideoBodySchema) {}
export class UpdateVideoBodyDTO extends createZodDto(UpdateVideoBodySchema) {}
export class VideoSentenceDTO extends createZodDto(VideoSentenceSchema) {}
export class CreateVideoSentenceBodyDTO extends createZodDto(CreateVideoSentenceBodySchema) {}
export class UpdateVideoSentenceBodyDTO extends createZodDto(UpdateVideoSentenceBodySchema) {}
export class ProcessYoutubeVideoUrlBodyDTO extends createZodDto(ProcessYoutubeVideoUrlBodySchema) {}
export class ProcessedVideoSentenceDTO extends createZodDto(ProcessedVideoSentenceSchema) {}
export class ProcessYoutubeVideoUrlResDTO extends createZodDto(ProcessYoutubeVideoUrlResSchema) {}
export class AddVideoVocabulariesBodyDTO extends createZodDto(AddVideoVocabulariesBodySchema) {}
