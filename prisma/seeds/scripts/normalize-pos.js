const fs = require('fs')
const path = require('path')

const TYPE_TO_POS = {
  noun: 'NOUN',
  verb: 'VERB',
  'auxiliary verb': 'VERB',
  'modal verb': 'VERB',
  'linking verb': 'VERB',
  adjective: 'ADJECTIVE',
  adverb: 'ADVERB',
  pronoun: 'PRONOUN',
  preposition: 'PREPOSITION',
  conjunction: 'CONJUNCTION',
  exclamation: 'INTERJECTION',
  determiner: 'DETERMINER',
  'indefinite article': 'DETERMINER',
  'definite article': 'DETERMINER',
  number: 'NUMERAL',
  'ordinal number': 'NUMERAL',
  'infinitive marker': 'OTHER',
}

const INPUT_PATH = path.join(__dirname, '..', 'data', 'full-word.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'full-word-normalized.json')

const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))

const unmapped = new Set()

const updated = data.map((item) => {
  const raw = (item.value.type || item.value.partOfSpeech || '').toLowerCase().trim()
  const pos = TYPE_TO_POS[raw]

  if (!pos) unmapped.add(raw)

  return {
    ...item,
    value: {
      ...item.value,
      partOfSpeech: pos ?? 'OTHER',
    },
  }
})

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2), 'utf8')

console.log(`Done. ${updated.length} entries written to full-word-normalized.json`)
if (unmapped.size > 0) {
  console.warn('Unmapped types (set to OTHER):', [...unmapped])
} else {
  console.log('All types mapped successfully.')
}
