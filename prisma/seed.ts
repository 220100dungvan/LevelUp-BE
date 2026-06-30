import 'dotenv/config'
import { seedTopics } from './seeds/topics.seed'
import { seedArticleTopics } from './seeds/article-topics.seed'
import { seedSpeakingTopics } from './seeds/speaking-topics.seed'
import { seedVocabularyLists } from './seeds/vocabulary-lists.seed'
import { seedVocabularies } from './seeds/vocabularies.seed'
import { seedVideoTopics } from './seeds/video-topic.seed'
import { seedWords } from './seeds/words.seed'

async function main() {
  console.log('Starting database seeding...\n')

  try {
    await seedTopics()
    await seedArticleTopics()
    await seedSpeakingTopics()
    await seedVideoTopics()
    await seedVocabularyLists()
    await seedVocabularies()
    await seedWords()

    console.log('\n Database seeding completed successfully!')
  } catch (error) {
    console.error('\n Database seeding failed:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
