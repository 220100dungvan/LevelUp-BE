const fs = require('fs')
const path = require('path')

const INPUT_PATH = path.join(__dirname, '..', 'data', 'full-word-with-meanings.json')
const PROGRESS_PATH = path.join(__dirname, '..', 'data', 'synonyms-progress.json')

const CONCURRENCY = 10
const DELAY_MS = 200
const MAX_RESULTS = 5 // Số synonyms/antonyms tối đa mỗi từ

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.status === 429) {
        await sleep(2000 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (i === retries - 1) throw err
      await sleep(500 * (i + 1))
    }
  }
}

async function fetchSynonyms(word) {
  const data = await fetchWithRetry(
    `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=${MAX_RESULTS}`,
  )
  return data.map((item) => item.word)
}

async function fetchAntonyms(word) {
  const data = await fetchWithRetry(
    `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=${MAX_RESULTS}`,
  )
  return data.map((item) => item.word)
}

async function processWord(word) {
  const [synonyms, antonyms] = await Promise.all([fetchSynonyms(word), fetchAntonyms(word)])
  return { synonyms, antonyms }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))

  let progress = {}
  if (fs.existsSync(PROGRESS_PATH)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
    console.log(`Resuming: ${Object.keys(progress).length}/${data.length} done`)
  }

  const total = data.length
  let done = Object.keys(progress).length

  for (let i = 0; i < data.length; i += CONCURRENCY) {
    const batch = data.slice(i, i + CONCURRENCY).filter((item) => progress[item.value.word] === undefined)

    if (batch.length === 0) continue

    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await processWord(item.value.word)
          return { word: item.value.word, ...result }
        } catch (err) {
          console.warn(`  [FAIL] ${item.value.word}: ${err.message}`)
          return { word: item.value.word, synonyms: [], antonyms: [] }
        }
      }),
    )

    for (const r of results) {
      progress[r.word] = { synonyms: r.synonyms, antonyms: r.antonyms }
      done++
    }

    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8')
    console.log(`Progress: ${done}/${total} (${Math.round((done / total) * 100)}%)`)

    await sleep(DELAY_MS)
  }

  // Ghi vào file (update trực tiếp INPUT_PATH)
  const updated = data.map((item) => {
    const { synonyms, antonyms } = progress[item.value.word] ?? { synonyms: [], antonyms: [] }
    return {
      ...item,
      value: {
        ...item.value,
        synonyms,
        antonyms,
      },
    }
  })

  fs.writeFileSync(INPUT_PATH, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`\nDone! Updated ${updated.length} entries in full-word-with-meanings.json`)

  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH)
  console.log('Progress file cleaned up.')
}

main().catch(console.error)
