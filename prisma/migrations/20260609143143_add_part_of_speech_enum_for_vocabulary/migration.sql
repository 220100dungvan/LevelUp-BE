/*
  Warnings:

  - The `part_of_speech` column on the `vocabularies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION', 'CONJUNCTION', 'INTERJECTION', 'DETERMINER', 'NUMERAL', 'PHRASE', 'OTHER');

ALTER TABLE "vocabularies"
ALTER COLUMN "part_of_speech"
TYPE "PartOfSpeech"
USING (
  CASE UPPER(part_of_speech)
    WHEN 'NOUN' THEN 'NOUN'::"PartOfSpeech"
    WHEN 'VERB' THEN 'VERB'::"PartOfSpeech"
    WHEN 'ADJECTIVE' THEN 'ADJECTIVE'::"PartOfSpeech"
    WHEN 'ADVERB' THEN 'ADVERB'::"PartOfSpeech"
    WHEN 'PHRASE' THEN 'PHRASE'::"PartOfSpeech"
    ELSE 'OTHER'::"PartOfSpeech"
  END
);

-- AlterTable
ALTER TABLE "vocabularies"
ALTER COLUMN "part_of_speech"
TYPE "PartOfSpeech"
USING (
  CASE UPPER(part_of_speech::text)
    WHEN 'NOUN' THEN 'NOUN'::"PartOfSpeech"
    WHEN 'VERB' THEN 'VERB'::"PartOfSpeech"
    WHEN 'ADJECTIVE' THEN 'ADJECTIVE'::"PartOfSpeech"
    WHEN 'ADVERB' THEN 'ADVERB'::"PartOfSpeech"
    WHEN 'PRONOUN' THEN 'PRONOUN'::"PartOfSpeech"
    WHEN 'PREPOSITION' THEN 'PREPOSITION'::"PartOfSpeech"
    WHEN 'CONJUNCTION' THEN 'CONJUNCTION'::"PartOfSpeech"
    WHEN 'INTERJECTION' THEN 'INTERJECTION'::"PartOfSpeech"
    WHEN 'DETERMINER' THEN 'DETERMINER'::"PartOfSpeech"
    WHEN 'NUMERAL' THEN 'NUMERAL'::"PartOfSpeech"
    WHEN 'PHRASE' THEN 'PHRASE'::"PartOfSpeech"
    ELSE 'OTHER'::"PartOfSpeech"
  END
);

-- AlterTable
ALTER TABLE "vocabularies" ALTER COLUMN "part_of_speech" SET NOT NULL;
