export interface WordTiming {
  text: string
  start: number
  end: number
}

export interface SentenceTiming {
  start: number
  end: number
  words: WordTiming[]
}

export type AudioData = SentenceTiming[]
