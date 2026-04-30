import { Injectable } from '@nestjs/common'
import { Prisma } from '@/generated/prisma/client'
import { PrismaService } from '@/common/services/prisma.service'
import {
  CreateVideoBodyType,
  CreateVideoSentenceBodyType,
  CreateVideoTopicBodyType,
  GetVideosQueryType,
  UpdateVideoBodyType,
  UpdateVideoSentenceBodyType,
  UpdateVideoTopicBodyType,
} from '@/modules/video/video.schema'

@Injectable()
export class VideoRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAllTopics() {
    return this.prismaService.videoTopic.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
  }

  async findVideos(query: GetVideosQueryType, userId?: string) {
    const { topicId, level, search, page, limit } = query
    const skip = (page - 1) * limit

    const where: Prisma.VideoWhereInput = {
      deletedAt: null,
      ...(topicId && { videoMappings: { some: { topicId } } }),
      ...(level && { level }),
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    }

    const [videos, total] = await Promise.all([
      this.prismaService.video.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          videoMappings: {
            where: { videoTopic: { deletedAt: null } },
            include: {
              videoTopic: { select: { id: true, name: true, thumbnailUrl: true } },
            },
          },
          _count: { select: { sentences: true, learningSessions: true } },
        },
      }),
      this.prismaService.video.count({ where }),
    ])

    // avgScore (shadowing) per video
    const videoIds = videos.map((v) => v.id)

    const sessions =
      userId && videoIds.length > 0
        ? await this.prismaService.userLearningSession.findMany({
            where: {
              userId,
              videoId: { in: videoIds },
              mode: { in: ['DICTATION', 'SHADOWING'] },
            },
            select: {
              videoId: true,
              mode: true,
            },
          })
        : []

    const practiceFlagMap = new Map<string, { hasDictationPracticed: boolean; hasShadowingPracticed: boolean }>()
    for (const session of sessions) {
      const existing = practiceFlagMap.get(session.videoId) ?? {
        hasDictationPracticed: false,
        hasShadowingPracticed: false,
      }
      if (session.mode === 'DICTATION') {
        existing.hasDictationPracticed = true
      }
      if (session.mode === 'SHADOWING') {
        existing.hasShadowingPracticed = true
      }
      practiceFlagMap.set(session.videoId, existing)
    }

    return {
      data: videos.map((v) => {
        const topics = v.videoMappings.map((mapping) => mapping.videoTopic)
        const practiceFlag = practiceFlagMap.get(v.id)
        return {
          id: v.id,
          topicIds: topics.map((topic) => topic.id),
          level: v.level,
          title: v.title,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          durationSec: v.durationSec,
          createdAt: v.createdAt,
          deletedAt: v.deletedAt,
          topics,
          sentenceCount: v._count.sentences,
          sessionCount: v._count.learningSessions,
          hasDictationPracticed: practiceFlag?.hasDictationPracticed ?? false,
          hasShadowingPracticed: practiceFlag?.hasShadowingPracticed ?? false,
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findVideoById(videoId: string) {
    const video = await this.prismaService.video.findUnique({
      where: { id: videoId, deletedAt: null },
      include: {
        videoMappings: {
          where: { videoTopic: { deletedAt: null } },
          include: {
            videoTopic: { select: { id: true, name: true, thumbnailUrl: true } },
          },
        },
        sentences: { orderBy: { orderIndex: 'asc' } },
        // mediaLinks relation does not exist on Video in Prisma schema.
        // Load media vocabularies via separate query below.
        _count: { select: { sentences: true, learningSessions: true } },
      },
    })
    if (!video) return null

    const avgScoreRaw = await this.prismaService.$queryRaw<{ avgScore: number | null }[]>`
      SELECT AVG(usr.score) AS "avgScore"
      FROM user_learning_sessions uls
      JOIN user_shadowing_results usr ON usr.session_id = uls.id
      WHERE uls."video_id" = ${videoId}::uuid
        AND uls.mode = 'SHADOWING'
    `

    const topics = video.videoMappings.map((mapping) => mapping.videoTopic)

    // fetch media vocabulary links directly (polymorphic association handled at app layer)
    const mediaLinks = await this.prismaService.mediaVocabulary.findMany({
      where: { mediaId: videoId, mediaType: 'VIDEO' },
      include: { vocabulary: true },
    })
    const vocabularies = mediaLinks.map((link) => link.vocabulary)

    return {
      id: video.id,
      topicIds: topics.map((topic) => topic.id),
      level: video.level,
      title: video.title,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      durationSec: video.durationSec,
      createdAt: video.createdAt,
      deletedAt: video.deletedAt,
      topics,
      sentences: video.sentences,
      vocabularies,
      sentenceCount: video._count.sentences,
      sessionCount: video._count.learningSessions,
      avgScore: avgScoreRaw[0]?.avgScore ?? null,
    }
  }

  findSentenceById(sentenceId: number) {
    return this.prismaService.videoSentence.findUnique({ where: { id: sentenceId } })
  }

  findTopicById(topicId: string) {
    return this.prismaService.videoTopic.findUnique({ where: { id: topicId, deletedAt: null } })
  }

  createTopic(data: CreateVideoTopicBodyType, thumbnailUrl: string) {
    return this.prismaService.videoTopic.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl,
      },
    })
  }

  updateTopic(topicId: string, data: UpdateVideoTopicBodyType, thumbnailUrl?: string) {
    return this.prismaService.videoTopic.update({
      where: { id: topicId, deletedAt: null },
      data: {
        ...data,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      },
    })
  }

  softDeleteTopic(topicId: string) {
    return this.prismaService.videoTopic.update({
      where: { id: topicId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
  }

  createVideo(data: CreateVideoBodyType) {
    const topicIds = [...new Set(data.topicIds ?? [])]
    return this.prismaService.video.create({
      data: {
        level: data.level,
        title: data.title,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        durationSec: data.durationSec,
        videoMappings: {
          createMany: {
            data: topicIds.map((topicId) => ({ topicId })),
            skipDuplicates: true,
          },
        },
      },
    })
  }

  createVideoWithSentences(data: CreateVideoBodyType) {
    return this.prismaService.$transaction(async (tx) => {
      const topicIds = [...new Set(data.topicIds ?? [])]
      const createdVideo = await tx.video.create({
        data: {
          level: data.level,
          title: data.title,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          durationSec: data.durationSec,
          videoMappings: {
            createMany: {
              data: topicIds.map((topicId) => ({ topicId })),
              skipDuplicates: true,
            },
          },
        },
      })

      const sentences = data.sentences ?? []
      if (sentences.length > 0) {
        await tx.videoSentence.createMany({
          data: sentences.map((sentence, index) => ({
            videoId: createdVideo.id,
            content: sentence.content,
            meaningVi: sentence.meaningVi,
            ipa: sentence.ipa,
            startTime: sentence.startTime,
            endTime: sentence.endTime,
            orderIndex: sentence.orderIndex ?? index,
          })),
        })
      }

      return createdVideo
    })
  }

  countVocabularyByIds(vocabularyIds: string[]) {
    return this.prismaService.vocabulary.count({
      where: {
        id: { in: vocabularyIds },
        deletedAt: null,
      },
    })
  }

  countTopicsByIds(topicIds: string[]) {
    return this.prismaService.videoTopic.count({
      where: {
        id: { in: topicIds },
        deletedAt: null,
      },
    })
  }

  linkVideoVocabularies(videoId: string, vocabularyIds: string[]) {
    return this.prismaService.mediaVocabulary.createMany({
      data: vocabularyIds.map((vocabularyId) => ({
        mediaId: videoId,
        mediaType: 'VIDEO',
        vocabularyId,
      })),
      skipDuplicates: true,
    })
  }

  updateVideo(videoId: string, data: UpdateVideoBodyType) {
    const { topicIds: _topicIds, ...videoData } = data
    return this.prismaService.video.update({
      where: { id: videoId, deletedAt: null },
      data: videoData,
    })
  }

  replaceVideoTopics(videoId: string, topicIds: string[]) {
    const uniqueTopicIds = [...new Set(topicIds)]
    return this.prismaService.$transaction(async (tx) => {
      await tx.videoTopicMapping.deleteMany({ where: { videoId } })
      if (uniqueTopicIds.length > 0) {
        await tx.videoTopicMapping.createMany({
          data: uniqueTopicIds.map((topicId) => ({ videoId, topicId })),
          skipDuplicates: true,
        })
      }
    })
  }

  softDeleteVideo(videoId: string) {
    return this.prismaService.video.update({
      where: { id: videoId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
  }

  async getNextSentenceOrderIndex(videoId: string) {
    const max = await this.prismaService.videoSentence.aggregate({
      where: { videoId },
      _max: { orderIndex: true },
    })
    return (max._max.orderIndex ?? -1) + 1
  }

  createSentence(videoId: string, data: CreateVideoSentenceBodyType & { orderIndex: number }) {
    return this.prismaService.videoSentence.create({
      data: {
        videoId,
        content: data.content,
        meaningVi: data.meaningVi,
        ipa: data.ipa,
        startTime: data.startTime,
        endTime: data.endTime,
        orderIndex: data.orderIndex,
      },
    })
  }

  updateSentence(sentenceId: number, data: UpdateVideoSentenceBodyType) {
    return this.prismaService.videoSentence.update({
      where: { id: sentenceId },
      data,
    })
  }

  deleteSentence(sentenceId: number) {
    return this.prismaService.videoSentence.delete({ where: { id: sentenceId } })
  }

  findVideosByTopicIds(topicIds: string[], excludeVideoId?: string) {
    return this.prismaService.video.findMany({
      where: {
        deletedAt: null,
        videoMappings: {
          some: {
            topicId: { in: topicIds },
          },
        },
        ...(excludeVideoId && { id: { not: excludeVideoId } }),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
      },
    })
  }
}
