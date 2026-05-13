export type GiphyResponseType = {
  data: {
    type: string
    url: string
    id: string
    slug: string
    title: string
    images: {
      fixed_height_still: {
        url: string
      }
    }
  }[]
}

export type UrbanDictionaryResponseType = {
  list: {
    author: string
    current_vote: string
    defid: number
    definition: string
    example: string
    permalink: string
    thumbs_down: number
    thumbs_up: number
    word: string
    written_on: string
  }[]
}

// Response types for FREE_DICTIONARY_API_ENDPOINT
export type FreeDictionaryResponseType = {
  word?: string
  entries?: FreeDictionaryEntry[]
}

export type FreeDictionaryEntry = {
  language?: { code?: string; name?: string } | string
  partOfSpeech?: string
  pronunciations?: FreePronunciation[]
  senses?: FreeSense[]
  forms?: { word?: string; tags?: string[] }[]
  // allow other fields present in the upstream response
  [key: string]: any
}

export type FreePronunciation = {
  type?: string
  text?: string
  audio?: string
  tags?: string[]
}

export type FreeSense = {
  definition?: string
  tags?: string[]
  examples?: string[]
  quotes?: Array<{ text?: string; reference?: string }>
  synonyms?: string[]
  antonyms?: string[]
  translations?: Array<{ language?: { code?: string; name?: string }; word?: string }>
  subsenses?: FreeSense[]
  [key: string]: any
}

export type DictionaryResponseType = {
  word: string
  phonetics: {
    text: string
    audio?: string
  }[]
}[]
