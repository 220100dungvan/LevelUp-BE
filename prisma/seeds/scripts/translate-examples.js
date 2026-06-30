const fs = require('fs')
const path = require('path')

const INPUT_PATH = path.join(__dirname, '..', 'data', 'full-word-normalized.json')
const PROGRESS_PATH = path.join(__dirname, '..', 'data', 'translate-progress.json')

const BATCH_SIZE = 10
const DELAY_MS = 300

async function translateToVi(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json[0].map((part) => part[0]).join('')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))

  let progress = {}
  if (fs.existsSync(PROGRESS_PATH)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
    console.log(`Resuming from progress: ${Object.keys(progress).length} words done`)
  }

  const total = data.length
  let done = Object.keys(progress).length

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (item) => {
        const word = item.value.word
        if (progress[word] !== undefined) return

        const examples = item.value.examples
        const en = Array.isArray(examples) && examples.length > 0 ? examples[0] : ''

        if (!en) {
          progress[word] = { en: '', vi: '' }
          return
        }

        let vi = ''
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            vi = await translateToVi(en)
            break
          } catch (err) {
            if (attempt === 2) {
              console.warn(`  Failed to translate "${word}": ${err.message}`)
              vi = ''
            } else {
              await sleep(500)
            }
          }
        }

        progress[word] = { en, vi }
        done++
      }),
    )

    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8')
    console.log(`Progress: ${done}/${total} (${Math.round((done / total) * 100)}%)`)

    await sleep(DELAY_MS)
  }

  const updated = data.map((item) => {
    const word = item.value.word
    const example = progress[word] ?? { en: '', vi: '' }
    const { examples: _removed, ...restValue } = item.value
    return {
      ...item,
      value: {
        ...restValue,
        example,
      },
    }
  })

  fs.writeFileSync(INPUT_PATH, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`\nDone! Updated full-word-normalized.json with ${updated.length} entries.`)

  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH)
  console.log('Progress file cleaned up.')
}

main().catch(console.error)
