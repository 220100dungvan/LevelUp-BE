export type WordStatus = 'correct' | 'wrong' | 'missing' | 'extra'

export interface WordFeedback {
  word: string
  status: WordStatus
  ipa?: string
}

/**
 * Chuẩn hoá text: lowercase + xoá dấu câu + trim khoảng trắng thừa
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-–—]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Levenshtein Distance giữa 2 mảng token (word-level)
 */
export function levenshteinWords(a: string[], b: string[]): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/**
 * Greedy word-by-word diff dùng cho Dictation
 */
export function computeDictationDiff(
  userText: string,
  originalContent: string,
): {
  diff: WordFeedback[]
  correctCount: number
  wrongCount: number
  correctnessPercentage: number
  isCorrect: boolean
} {
  const userWords = normalizeText(userText).split(' ').filter(Boolean)
  const originalWords = normalizeText(originalContent).split(' ').filter(Boolean)

  const diff: WordFeedback[] = []
  let correctCount = 0
  let wrongCount = 0

  const maxLen = Math.max(userWords.length, originalWords.length)
  for (let i = 0; i < maxLen; i++) {
    const uw = userWords[i]
    const ow = originalWords[i]

    if (ow === undefined) {
      diff.push({ word: uw, status: 'extra' })
      wrongCount++
    } else if (uw === undefined) {
      diff.push({ word: ow, status: 'missing' })
      wrongCount++
    } else if (uw === ow) {
      diff.push({ word: ow, status: 'correct' })
      correctCount++
    } else {
      diff.push({ word: ow, status: 'wrong' })
      wrongCount++
    }
  }

  const total = originalWords.length
  const correctnessPercentage = total === 0 ? 100 : Math.round((correctCount / total) * 100)
  return { diff, correctCount, wrongCount, correctnessPercentage, isCorrect: correctnessPercentage === 100 }
}

/**
 * Levenshtein-based score dùng cho Shadowing
 */
export function computeShadowingScore(
  transcribedText: string,
  originalContent: string,
): {
  score: number
  feedbackWords: WordFeedback[]
} {
  const userWords = normalizeText(transcribedText).split(' ').filter(Boolean)
  const originalWords = normalizeText(originalContent).split(' ').filter(Boolean)

  const distance = levenshteinWords(userWords, originalWords)
  const maxLen = Math.max(userWords.length, originalWords.length)
  const score = maxLen === 0 ? 100 : Math.round((1 - distance / maxLen) * 100)

  const feedbackWords: WordFeedback[] = []
  for (let i = 0; i < Math.max(userWords.length, originalWords.length); i++) {
    const uw = userWords[i]
    const ow = originalWords[i]
    if (ow === undefined) feedbackWords.push({ word: uw, status: 'extra' })
    else if (uw === undefined) feedbackWords.push({ word: ow, status: 'missing' })
    else if (uw === ow) feedbackWords.push({ word: ow, status: 'correct' })
    else feedbackWords.push({ word: ow, status: 'wrong' })
  }

  return { score, feedbackWords }
}
