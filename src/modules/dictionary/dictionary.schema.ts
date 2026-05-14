import z from 'zod'

export const DictionaryLookupQuerySchema = z
  .object({
    word: z.string().min(1),
  })
  .strict()

const SLangItemSchema = z.object({
  phrase: z.string(),
  example: z.string().optional(),
})

export const DictionaryLookupResSchema = z.object({
  word: z.string(),
  // Tab 1: Dịch (Nghĩa & Phát âm)
  phonetics: z.object({
    phonetic_uk: z.object({
      text: z.string(),
      audio: z.string().optional(),
    }),
    phonetic_us: z.object({
      text: z.string(),
      audio: z.string().optional(),
    }),
  }),
  meanings: z.array(
    z.object({
      partOfSpeech: z.string(),
      definitions: z.array(
        z.object({
          definition: z.string(),
          example: z.string().optional(),
          synonyms: z.array(z.string()),
          antonyms: z.array(z.string()),
        }),
      ),
    }),
  ),
  // Tab 2: Hình ảnh (Giphy)
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      title: z.string(),
    }),
  ),
  // Tab 3: Nghĩa lóng (Urban Dictionary)
  slangs: z.array(SLangItemSchema),
  //Tab 4: Các từ đồng nghĩa & trái nghĩa
  relatedWords: z.object({
    synonyms: z.array(z.string()),
    antonyms: z.array(z.string()),
  }),
})

export type DictionaryLookupQueryType = z.infer<typeof DictionaryLookupQuerySchema>
export type DictionaryLookupResType = z.infer<typeof DictionaryLookupResSchema>

export type SlangItemType = z.infer<typeof SLangItemSchema>
