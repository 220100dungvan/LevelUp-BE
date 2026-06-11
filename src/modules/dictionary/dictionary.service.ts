import envConfig from '@/common/utils/config'
import { DictionaryLookupResType, SlangItemType } from '@/modules/dictionary/dictionary.schema'
import {
  DictionaryResponseType,
  FreeDictionaryResponseType,
  FreeSense,
  GiphyResponseType,
  UrbanDictionaryResponseType,
} from '@/modules/dictionary/interfaces/dictionary.type'
import { VocabularyIndexService } from '@/modules/vocabulary/vocabulary-index.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Cache } from 'cache-manager'

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name)

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly vocabularyIndexService: VocabularyIndexService,
  ) {}

  async lookup(word: string): Promise<DictionaryLookupResType> {
    const normalizedWord = word.toLowerCase().trim()
    const cacheKey = `dict:${normalizedWord}`

    const cached = await this.cacheManager.get<DictionaryLookupResType>(cacheKey)
    if (cached) return cached

    const [giphyResponse, slangsResponse, freeDictResponse, DictResponse] = await Promise.allSettled([
      this.fetchGiphyImages(word),
      this.fetchSlangs(word),
      this.fetchFreeDictionary(word),
      this.fetchDictionary(word),
    ])

    const free = freeDictResponse.status === 'fulfilled' ? freeDictResponse.value : null

    // Elasticsearch fallback
    // When the external free-dictionary API returns no meaningful data,
    // look up the word in our own vocabulary index in Elasticsearch.
    let meanings = free?.meanings ?? []
    const relatedWords = free?.relatedWords ?? { synonyms: [], antonyms: [] }

    if (!meanings.length) {
      const esDoc = await this.vocabularyIndexService.lookupWord(normalizedWord)
      if (esDoc) {
        this.logger.debug(`Dictionary fallback: found "${esDoc.word}" in Elasticsearch`)

        // Build a single meaning entry from our vocabulary document
        meanings = [
          {
            partOfSpeech: esDoc.partOfSpeech ?? 'unknown',
            definitions: [
              {
                definition: esDoc.meaningEn ?? esDoc.meaningVi,
                example: esDoc.exampleEn ?? undefined,
                synonyms: [],
                antonyms: [],
              },
            ],
          },
        ]
      }
    }

    const result = {
      word: free?.word ?? word,
      phonetics:
        DictResponse.status === 'fulfilled'
          ? {
              phonetic_uk: {
                text: DictResponse.value.uk.text,
                audio: DictResponse.value.uk.audio,
              },
              phonetic_us: {
                text: DictResponse.value.us.text,
                audio: DictResponse.value.us.audio,
              },
            }
          : {
              phonetic_uk: { text: '', audio: '' },
              phonetic_us: { text: '', audio: '' },
            },
      meanings,
      relatedWords,
      images: giphyResponse.status === 'fulfilled' ? giphyResponse.value : [],
      slangs: slangsResponse.status === 'fulfilled' ? slangsResponse.value : [],
    } as unknown as DictionaryLookupResType

    await this.cacheManager.set(cacheKey, result, 24 * 60 * 60 * 1000)

    return result
  }

  private fetchFreeDictionary(word: string): Promise<{
    word: string
    meanings: {
      partOfSpeech: string
      definitions: { definition: string; example?: string; synonyms: string[]; antonyms: string[] }[]
    }[]
    relatedWords: { synonyms: string[]; antonyms: string[] }
  }> {
    return fetch(`${envConfig.FREE_DICTIONARY_API_ENDPOINT}/${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: FreeDictionaryResponseType) => {
        const entries = Array.isArray(data.entries) ? data.entries : []

        const meanings = entries.map((entry) => {
          const definitions: any[] = []

          const walkSenses = (senses: FreeSense[] = []) => {
            for (const s of senses) {
              if (s.definition) {
                definitions.push({
                  definition: s.definition,
                  example: Array.isArray(s.examples) && s.examples.length ? s.examples[0] : undefined,
                  synonyms: Array.isArray(s.synonyms) ? s.synonyms : [],
                  antonyms: Array.isArray(s.antonyms) ? s.antonyms : [],
                })
              }
              if (Array.isArray(s.subsenses) && s.subsenses.length) walkSenses(s.subsenses)
            }
          }

          if (Array.isArray(entry.senses)) walkSenses(entry.senses)

          return {
            partOfSpeech: entry.partOfSpeech ?? '',
            definitions,
          }
        })

        const synonymsSet = new Set<string>()
        const antonymsSet = new Set<string>()
        for (const m of meanings) {
          for (const d of m.definitions) {
            for (const s of d.synonyms || []) synonymsSet.add(s)
            for (const a of d.antonyms || []) antonymsSet.add(a)
          }
        }

        return {
          word: data.word || word,
          meanings,
          relatedWords: { synonyms: Array.from(synonymsSet), antonyms: Array.from(antonymsSet) },
        }
      })
  }

  private fetchDictionary(word: string): Promise<{
    uk: { text: string; audio?: string }
    us: { text: string; audio?: string }
  }> {
    return fetch(`${envConfig.DICTIONARY_API_ENDPOINT}/${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: DictionaryResponseType) => {
        const phoneticUK = data[0]?.phonetics.find(
          (p) => (p.audio && p.audio.includes('uk.mp3')) || (p.audio && p.audio.includes('au.mp3')),
        ) ||
          data[1]?.phonetics.find(
            (p) => (p.audio && p.audio.includes('uk.mp3')) || (p.audio && p.audio.includes('au.mp3')),
          ) || {
            text: '',
            audio: '',
          }
        const phoneticUS = data[0]?.phonetics.find((p) => p.audio && p.audio.includes('us.mp3')) || {
          text: '',
          audio: '',
        }
        return {
          uk: phoneticUK,
          us: phoneticUS,
        }
      })
  }

  private fetchGiphyImages(word: string): Promise<
    {
      id: string
      url: string
      title: string
    }[]
  > {
    return fetch(
      `${envConfig.GIPHY_API_ENDPOINT}?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(word)}&limit=10&rating=g`,
    )
      .then((res) => res.json())
      .then((data: GiphyResponseType) => {
        return data.data.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.images.fixed_height_still.url,
        }))
      })
  }

  private fetchSlangs(word: string): Promise<SlangItemType[]> {
    return fetch(`${envConfig.URBAN_DICTIONARY_API_ENDPOINT}?term=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: UrbanDictionaryResponseType) => {
        return data.list.map((item) => ({
          phrase: item.word,
          example: item.example,
        }))
      })
  }
}
