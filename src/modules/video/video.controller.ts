import { UserRole } from '@/common/constants/auth.constant'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodResponse } from 'nestjs-zod'
import { VideoService } from '@/modules/video/video.service'
import {
  CreateVideoBodyDTO,
  CreateVideoSentenceBodyDTO,
  CreateVideoTopicBodyDTO,
  GetVideoDetailResDTO,
  GetVideosQueryDTO,
  GetVideosResDTO,
  GetVideoTopicsResDTO,
  ProcessYoutubeVideoUrlBodyDTO,
  ProcessYoutubeVideoUrlResDTO,
  UpdateVideoBodyDTO,
  UpdateVideoSentenceBodyDTO,
  UpdateVideoTopicBodyDTO,
  VideoSentenceDTO,
  VideoTopicDTO,
} from '@/modules/video/video.dto'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import {
  optionalImageFileValidationPipe,
  requiredImageFileValidationPipe,
} from '@/common/pipes/image-file-validation.pipe'

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * GET /videos/topics
   * Lấy danh sách chủ đề video
   */
  @Get('topics')
  @IsPublic()
  @ZodResponse({ type: GetVideoTopicsResDTO })
  getVideoTopics() {
    return this.videoService.getVideoTopics()
  }

  // (Admin) tạo VideoTopic
  @Post('topics')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: VideoTopicDTO })
  createTopic(
    @Body() body: CreateVideoTopicBodyDTO,
    @UploadedFile(requiredImageFileValidationPipe)
    thumbnail: UploadedFileData,
  ) {
    return this.videoService.createTopic(body, thumbnail)
  }

  @Patch('topics/:topicId')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: VideoTopicDTO })
  updateTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() body: UpdateVideoTopicBodyDTO,
    @UploadedFile(optionalImageFileValidationPipe)
    thumbnail?: UploadedFileData,
  ) {
    return this.videoService.updateTopic(topicId, body, thumbnail)
  }

  @Delete('topics/:topicId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteTopic(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.videoService.deleteTopic(topicId)
  }

  /**
   * GET /videos
   * Danh sách video: filter topicId / level, phân trang
   * Response mỗi item có: sentenceCount, sessionCount, avgScore, durationSec, topic
   */
  @Get()
  @ZodResponse({ type: GetVideosResDTO })
  getVideos(@Query() query: GetVideosQueryDTO, @ActiveUser('userId') userId?: string) {
    return this.videoService.getVideos(query, userId)
  }

  // (Admin) xử lý URL youtube
  @Post('process-url')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: ProcessYoutubeVideoUrlResDTO })
  processYoutubeVideoUrl(@Body() body: ProcessYoutubeVideoUrlBodyDTO) {
    return this.videoService.processYoutubeVideoUrl(body)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: GetVideoDetailResDTO })
  createVideo(@Body() body: CreateVideoBodyDTO) {
    return this.videoService.createVideo(body)
  }

  @Patch(':videoId')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: GetVideoDetailResDTO })
  updateVideo(@Param('videoId', ParseUUIDPipe) videoId: string, @Body() body: UpdateVideoBodyDTO) {
    return this.videoService.updateVideo(videoId, body)
  }

  @Delete(':videoId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteVideo(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.videoService.deleteVideo(videoId)
  }

  @Post(':videoId/sentences')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: VideoSentenceDTO })
  createSentence(@Param('videoId', ParseUUIDPipe) videoId: string, @Body() body: CreateVideoSentenceBodyDTO) {
    return this.videoService.createSentence(videoId, body)
  }

  @Patch(':videoId/sentences/:sentenceId')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: VideoSentenceDTO })
  updateSentence(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
    @Body() body: UpdateVideoSentenceBodyDTO,
  ) {
    return this.videoService.updateSentence(videoId, sentenceId, body)
  }

  @Delete(':videoId/sentences/:sentenceId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteSentence(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
  ) {
    return this.videoService.deleteSentence(videoId, sentenceId)
  }

  /**
   * GET /videos/:videoId
   * Chi tiết video + VideoSentence[]
   */
  @Get(':videoId')
  @ZodResponse({ type: GetVideoDetailResDTO })
  getVideoById(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.videoService.getVideoById(videoId)
  }
}
