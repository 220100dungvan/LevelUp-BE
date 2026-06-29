import { ElasticsearchService } from '@/common/services/elasticsearch.service'
import { PrismaService } from '@/common/services/prisma.service'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SearchVocabularyQueryType } from '@/modules/vocabulary/vocabulary.schema'
import { LevelType, PartOfSpeechType } from '@/common/constants/vocabulary.constant'

export const VOCABULARY_INDEX = 'vocabularies'

/** Shape stored in Elasticsearch */
export interface VocabularyDocument {
  id: string
  word: string
  phoneticUk: string | null
  phoneticUs: string | null
  partOfSpeech: PartOfSpeechType
  meaningVi: string
  meaningEn: string | null
  exampleEn: string | null
  exampleVi: string | null
  imageUrl: string | null
  audioUrlUk: string | null
  audioUrlUs: string | null
  audioExampleUrl: string | null
  level: LevelType | null
  deletedAt: string | null
}

@Injectable()
export class VocabularyIndexService implements OnModuleInit {
  private readonly logger = new Logger(VocabularyIndexService.name)

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    await this.ensureIndex()
    await this.seedIfEmpty()
  }

  // Index management

  async ensureIndex() {
    try {
      const exists = await this.esService.client.indices.exists({ index: VOCABULARY_INDEX })
      if (!exists) {
        await this.esService.client.indices.create({
          index: VOCABULARY_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              word: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }, // exact / sort
                  suggest: { type: 'search_as_you_type' }, // prefix / autocomplete
                },
              },
              phoneticUk: { type: 'keyword', index: false },
              phoneticUs: { type: 'keyword', index: false },
              partOfSpeech: { type: 'keyword' },
              meaningVi: { type: 'text', analyzer: 'standard' },
              meaningEn: { type: 'text', analyzer: 'standard' },
              exampleEn: { type: 'text', analyzer: 'standard' },
              exampleVi: { type: 'text', analyzer: 'standard' },
              imageUrl: { type: 'keyword', index: false },
              audioUrlUk: { type: 'keyword', index: false },
              audioUrlUs: { type: 'keyword', index: false },
              audioExampleUrl: { type: 'keyword', index: false },
              level: { type: 'keyword' },
              deletedAt: { type: 'date' },
            },
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
        })
        this.logger.log(`Index "${VOCABULARY_INDEX}" created`)
      }
    } catch (err) {
      this.logger.warn(`Could not ensure ES index: ${(err as Error).message}`)
    }
  }

  private async seedIfEmpty() {
    try {
      const available = await this.esService.isAvailable()
      if (!available) return

      const { count } = await this.esService.client.count({ index: VOCABULARY_INDEX })
      if (count > 0) return

      const vocabularies = await this.prismaService.vocabulary.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          word: true,
          phoneticUk: true,
          phoneticUs: true,
          partOfSpeech: true,
          meaningVi: true,
          meaningEn: true,
          exampleEn: true,
          exampleVi: true,
          imageUrl: true,
          audioUrlUk: true,
          audioUrlUs: true,
          audioExampleUrl: true,
          level: true,
        },
      })

      if (vocabularies.length === 0) return

      const docs: VocabularyDocument[] = vocabularies.map((v) => ({
        ...v,
        deletedAt: null,
      })) as VocabularyDocument[]

      await this.bulkIndex(docs)
      this.logger.log(`Seeded ${docs.length} vocabularies into Elasticsearch`)
    } catch (err) {
      this.logger.warn(`ES seed failed: ${(err as Error).message}`)
    }
  }

  // CRUD sync

  async indexVocabulary(doc: VocabularyDocument): Promise<void> {
    try {
      await this.esService.client.index({
        index: VOCABULARY_INDEX,
        id: doc.id,
        document: doc,
      })
    } catch (err) {
      this.logger.warn(`ES index failed for word "${doc.word}": ${(err as Error).message}`)
    }
  }

  async updateVocabulary(id: string, partial: Partial<VocabularyDocument>): Promise<void> {
    try {
      await this.esService.client.update({
        index: VOCABULARY_INDEX,
        id,
        doc: partial,
      })
    } catch (err) {
      this.logger.warn(`ES update failed for id "${id}": ${(err as Error).message}`)
    }
  }

  async deleteVocabulary(id: string): Promise<void> {
    try {
      await this.esService.client.update({
        index: VOCABULARY_INDEX,
        id,
        doc: { deletedAt: new Date().toISOString() },
      })
    } catch (err) {
      this.logger.warn(`ES soft-delete failed for id "${id}": ${(err as Error).message}`)
    }
  }

  // ─── Bulk seed (run once / migration) ─────────────────────────────────────

  async bulkIndex(docs: VocabularyDocument[]): Promise<void> {
    if (!docs.length) return
    try {
      const operations = docs.flatMap((doc) => [{ index: { _index: VOCABULARY_INDEX, _id: doc.id } }, doc])
      const result = await this.esService.client.bulk({ operations, refresh: true })
      if (result.errors) {
        this.logger.warn('Bulk index completed with some errors')
      } else {
        this.logger.log(`Bulk indexed ${docs.length} vocabularies`)
      }
    } catch (err) {
      this.logger.warn(`Bulk index failed: ${(err as Error).message}`)
    }
  }

  // Search

  /**
   * Full-text + prefix search against word / meaningVi / meaningEn.
   * Returns null when ES is unavailable so the caller can fall back to Prisma.
   */
  async search(query: SearchVocabularyQueryType): Promise<VocabularyDocument[] | null> {
    const available = await this.esService.isAvailable()
    if (!available) return null

    try {
      const { word, limit = 20 } = query
      const term = word.trim()

      const result = await this.esService.client.search<VocabularyDocument>({
        index: VOCABULARY_INDEX,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: term,
                  fields: ['word^4', 'word.suggest^3', 'meaningVi^2', 'meaningEn'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  prefix_length: 1,
                },
              },
            ],
            filter: [
              // Exclude soft-deleted
              { bool: { must_not: { exists: { field: 'deletedAt' } } } },
            ],
          },
        },
        sort: [
          // Exact prefix first
          { 'word.keyword': { order: 'asc' } },
          { _score: { order: 'desc' } },
        ],
      })

      return result.hits.hits.map((hit) => hit._source as VocabularyDocument)
    } catch (err) {
      this.logger.warn(`ES search failed: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Lookup a single word (exact + fuzzy) for the dictionary fallback.
   * Returns null when ES is unavailable or not found.
   */
  async lookupWord(word: string): Promise<VocabularyDocument | null> {
    const available = await this.esService.isAvailable()
    if (!available) return null

    try {
      const result = await this.esService.client.search<VocabularyDocument>({
        index: VOCABULARY_INDEX,
        size: 1,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: word.trim(),
                  fields: ['word^5', 'word.suggest^3'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  prefix_length: 1,
                },
              },
            ],
            filter: [{ bool: { must_not: { exists: { field: 'deletedAt' } } } }],
          },
        },
      })

      const hits = result.hits.hits
      if (!hits.length) return null
      return hits[0]._source as VocabularyDocument
    } catch (err) {
      this.logger.warn(`ES word lookup failed for "${word}": ${(err as Error).message}`)
      return null
    }
  }
}
