const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const INPUT_PATH = path.join(__dirname, '..', 'data', 'full-word-normalized.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'full-word-with-meanings.json')
const PROGRESS_PATH = path.join(__dirname, '..', 'data', 'meanings-progress.json')

const CONCURRENCY = 5
const DELAY_MS = 400

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (res.status === 429 || res.status === 503) {
        await sleep(2000 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (i === retries - 1) throw err
      await sleep(1000 * (i + 1))
    }
  }
}

function extractMeaningEn(html, level) {
  const $ = cheerio.load(html)
  const cefrClass = `ox3ksym_${level.toLowerCase()}`

  let meaningEn = ''
  $('.sense').each((_, el) => {
    if (meaningEn) return
    const sense = $(el)
    if (!sense.find(`.${cefrClass}`).length) return

    const usePart = sense.find('.use').first().text().trim()
    const defPart = sense.find('.def').first().text().trim()

    meaningEn = usePart ? `${usePart} - ${defPart}` : defPart
  })

  if (!meaningEn) {
    const firstDef = $('.sense .def').first().text().trim()
    const firstUse = $('.sense .use').first().text().trim()
    meaningEn = firstUse ? `${firstUse} - ${firstDef}` : firstDef
  }

  return meaningEn
}

async function translateToVi(word) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Translate HTTP ${res.status}`)
  const json = await res.json()
  return json[0].map((part) => part[0]).join('')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processWord(item) {
  const { word, href, level } = item.value

  let meaningEn = ''
  let meaningVi = ''

  try {
    const html = await fetchWithRetry(href)
    meaningEn = extractMeaningEn(html, level)
  } catch (err) {
    console.warn(`  [Oxford FAIL] ${word}: ${err.message}`)
  }

  try {
    meaningVi = await translateToVi(word)
  } catch (err) {
    console.warn(`  [Translate FAIL] ${word}: ${err.message}`)
  }

  return { meaningEn, meaningVi }
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
        const result = await processWord(item)
        return { word: item.value.word, ...result }
      }),
    )

    for (const r of results) {
      progress[r.word] = { meaningEn: r.meaningEn, meaningVi: r.meaningVi }
      done++
    }

    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8')
    console.log(`Progress: ${done}/${total} (${Math.round((done / total) * 100)}%)`)

    await sleep(DELAY_MS)
  }

  const updated = data.map((item) => {
    const { meaningEn, meaningVi } = progress[item.value.word] ?? { meaningEn: '', meaningVi: '' }
    return {
      ...item,
      value: {
        ...item.value,
        meaningEn,
        meaningVi,
      },
    }
  })

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`\nDone! Written to full-word-with-meanings.json (${updated.length} entries)`)

  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH)
}

main().catch(console.error)
